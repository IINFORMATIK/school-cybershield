#!/usr/bin/env python3
"""
CyberShield Client Agent - Lightweight monitoring
Sends metrics to server every 60 seconds to minimize network traffic
"""

import psutil
import socket
import subprocess
import requests
import time
import logging
from datetime import datetime
import platform
import sys

logging.basicConfig(level=logging.ERROR, handlers=[logging.FileHandler("client_agent.log")])
logger = logging.getLogger(__name__)


class ClientSystemMonitor:
    @staticmethod
    def get_system_stats():
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            ram = psutil.virtual_memory()
            disk = psutil.disk_usage("C:/")
            
            # Измерение температуры (Windows)
            temp = ClientSystemMonitor._get_temperature()
            
            # Получаем информацию о сети
            net_io = psutil.net_io_counters()
            
            return {
                "cpu": cpu_percent,
                "ram": ram.percent,
                "disk": disk.percent,
                "temp": temp,
                "processes": len(psutil.pids()),
                "uptime": ClientSystemMonitor._get_uptime(),
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv
            }
        except Exception as e:
            logger.error("Error: {}".format(str(e)))
            return {
                "cpu": 0, "ram": 0, "disk": 0, "temp": 0, 
                "processes": 0, "uptime": "Unknown", "bytes_sent": 0, "bytes_recv": 0
            }
    
    @staticmethod
    def _get_temperature():
        """Try to get CPU temperature"""
        try:
            # Try psutil (works on Windows with proper sensors installed)
            temps = psutil.sensors_temperatures()
            if temps:
                for name, entries in temps.items():
                    if entries:
                        return entries[0].current
            return 0
        except:
            try:
                # Fallback: try WMI on Windows
                result = subprocess.run(
                    ["wmic", "os", "get", "TotalVisibleMemorySize,FreePhysicalMemory", "/format:list"],
                    capture_output=True, text=True, encoding="utf-8", timeout=3
                )
                return 0
            except:
                return 0
    
    @staticmethod
    def _get_uptime():
        try:
            uptime_seconds = time.time() - psutil.boot_time()
            days = int(uptime_seconds // 86400)
            hours = int((uptime_seconds % 86400) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            if days > 0:
                return "{} d, {} h, {} m".format(days, hours, minutes)
            elif hours > 0:
                return "{} h, {} m".format(hours, minutes)
            else:
                return "{} m".format(minutes)
        except:
            return "Unknown"
    
    @staticmethod
    def get_firewall_status():
        try:
            result = subprocess.run(
                ["netsh", "advfirewall", "show", "allprofiles", "state"],
                capture_output=True, text=True, encoding="cp1251", errors="replace", timeout=5
            )
            return "Enabled" if "ON" in result.stdout.upper() else "Disabled"
        except:
            return "Unknown"
    
    @staticmethod
    def get_av_status():
        try:
            result = subprocess.run(
                ["powershell", "-Command", 
                 "Get-MpComputerStatus | Select-Object -ExpandProperty AntivirusEnabled"],
                capture_output=True, text=True, timeout=10
            )
            return "Active" if "True" in result.stdout else ("Disabled" if "False" in result.stdout else "Unknown")
        except:
            return "Unknown"
    
    @staticmethod
    def get_network_info():
        try:
            hostname = socket.gethostname()
            ip = None
            try:
                interfaces = psutil.net_if_addrs()
                priority_ips = []
                for iface_name, iface_addrs in interfaces.items():
                    for addr in iface_addrs:
                        if addr.family != socket.AF_INET:
                            continue
                        address = addr.address
                        if address.startswith('127.') or address.startswith('169.254.'):
                            continue
                        if address.startswith('192.168.'):
                            priority_ips.insert(0, address)
                        elif address.startswith('10.'):
                            priority_ips.insert(0, address)
                        elif address.startswith('172.'):
                            try:
                                second_octet = int(address.split('.')[1])
                                if 16 <= second_octet <= 31:
                                    priority_ips.insert(0, address)
                                else:
                                    priority_ips.append(address)
                            except:
                                priority_ips.append(address)
                        else:
                            priority_ips.append(address)
                if priority_ips:
                    ip = priority_ips[0]
            except:
                pass
            if not ip or ip.startswith('169.254.'):
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                    sock.connect(("8.8.8.8", 80))
                    ip = sock.getsockname()[0]
                    sock.close()
                except:
                    pass
            if not ip:
                try:
                    ip = socket.gethostbyname(hostname)
                except:
                    ip = "0.0.0.0"
            return {"hostname": hostname, "ip": ip if not ip.startswith('169.254.') else "0.0.0.0"}
        except:
            return {"hostname": "Unknown", "ip": "0.0.0.0"}


class CyberShieldClient:
    def __init__(self, server_url="http://localhost:5000", update_interval=60):
        self.server_url = server_url
        self.update_interval = update_interval
        self.monitor = ClientSystemMonitor()
        network_info = self.monitor.get_network_info()
        self.hostname = network_info["hostname"]
        self.ip = network_info["ip"]
        self.os = platform.system()
        self.client_id = self.hostname
        self.is_registered = False
    
    def register_with_server(self):
        try:
            data = {
                "client_id": self.client_id,
                "hostname": self.hostname,
                "ip": self.ip,
                "os": self.os
            }
            response = requests.post("{}/api/clients/register".format(self.server_url), json=data, timeout=5)
            if response.status_code == 200:
                self.is_registered = True
                return True
            else:
                logger.error("Registration failed: {}".format(response.status_code))
                return False
        except Exception as e:
            logger.error("Registration error: {}".format(str(e)))
            return False
    
    def send_system_data(self):
        try:
            if not self.is_registered:
                if not self.register_with_server():
                    return False
            system_stats = self.monitor.get_system_stats()
            firewall = self.monitor.get_firewall_status()
            av = self.monitor.get_av_status()
            data = {
                "client_id": self.client_id,
                "hostname": self.hostname,
                "ip": self.ip,
                "os": self.os,
                "cpu": system_stats["cpu"],
                "ram": system_stats["ram"],
                "disk": system_stats["disk"],
                "temp": system_stats["temp"],
                "processes": system_stats["processes"],
                "firewall": firewall,
                "avStatus": av,
                "uptime": system_stats["uptime"],
                "bytes_sent": system_stats.get("bytes_sent", 0),
                "bytes_recv": system_stats.get("bytes_recv", 0)
            }
            response = requests.post("{}/api/clients/update".format(self.server_url), json=data, timeout=5)
            if response.status_code == 200:
                return True
            else:
                logger.error("Send failed: {}".format(response.status_code))
                return False
        except Exception as e:
            logger.error("Error: {}".format(str(e)))
            return False
    
    def run(self):
        self.register_with_server()
        while True:
            try:
                self.send_system_data()
                time.sleep(self.update_interval)
            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error("Error: {}".format(str(e)))
                time.sleep(self.update_interval)


def main():
    server_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    update_interval = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    client = CyberShieldClient(server_url=server_url, update_interval=update_interval)
    client.run()


if __name__ == "__main__":
    main()


if __name__ == "__main__":
    main()
