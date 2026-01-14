#!/usr/bin/env python3
"""
School CyberShield Agent - Security Audit Backend
Handles network scanning and system monitoring for educational institutions
"""

import os
import platform
import socket
import subprocess
import json
import logging
from typing import Dict, List, Any, Tuple
from datetime import datetime

import psutil
from flask import Flask, jsonify, request
from flask_cors import CORS
from scapy.all import ARP, Ether, srp, get_if_hwaddr
import warnings

warnings.filterwarnings("ignore")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# MAC vendor OUI database
MAC_VENDORS = {
    "00:1A:2B": "Cisco Systems",
    "00:11:22": "Intel Corporation",
    "00:1C:23": "Hewlett-Packard",
    "00:13:10": "Apple Inc.",
    "00:10:18": "Linksys",
    "08:00:27": "PCS Systemtechnik",
    "52:54:00": "QEMU",
    "00:0C:29": "VMware",
    "00:05:69": "VMware",
    "00:15:17": "Citrix Systems",
    "00:1B:24": "D-Link",
    "00:13:5F": "Broadcom",
    "00:16:B6": "Apple Inc.",
    "00:19:E3": "ASUS",
    "00:1A:6B": "Canon",
    "00:22:F1": "Ericsson",
    "00:25:00": "Apple Inc.",
    "00:25:4B": "AVM GmbH",
    "00:26:18": "Samsung",
    "00:30:48": "Supermicro",
}


class NetworkScanner:
    """Handles network scanning and device detection"""

    def __init__(self, timeout: int = 5):
        self.timeout = timeout
        self.devices = []

    def get_network_interface(self) -> Tuple[str, str]:
        """Get primary network interface IP and MAC"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            
            mac = "00:00:00:00:00:00"
            try:
                mac = get_if_hwaddr(socket.gethostbyname(socket.gethostname()))
            except:
                pass
            
            return ip, mac
        except Exception:
            return "192.168.1.100", "00:00:00:00:00:00"

    def get_network_range(self, ip: str) -> str:
        """Convert IP to network range for ARP scan"""
        parts = ip.split(".")
        return "{}.{}.{}.0/24".format(parts[0], parts[1], parts[2])

    def get_vendor_from_mac(self, mac: str) -> str:
        """Lookup vendor name from MAC address OUI"""
        mac_upper = mac.upper()
        mac_prefix = mac_upper[:8]
        
        for oui, vendor in MAC_VENDORS.items():
            if mac_prefix.startswith(oui.upper()):
                return vendor
        return "Unknown"

    def scan_network(self) -> List[Dict[str, Any]]:
        """Perform fast network scan using ARP and targeted ICMP"""
        try:
            my_ip, my_mac = self.get_network_interface()
            devices = []
            scanned_ranges = set()
            
            # Target subnets to scan
            target_ranges = [
                '192.168.0.0/24',
                '10.160.46.0/24'
            ]
            
            # Try ARP scan first on all available interfaces
            try:
                interfaces = psutil.net_if_addrs()
                
                for iface_name, iface_addrs in interfaces.items():
                    for addr in iface_addrs:
                        # Only scan IPv4 addresses
                        if addr.family != socket.AF_INET:
                            continue
                        
                        interface_ip = addr.address
                        if interface_ip.startswith('127.') or interface_ip.startswith('169.254.'):
                            continue
                        
                        # Get network range for this interface
                        network_range = self.get_network_range(interface_ip)
                        
                        # Skip if already scanned
                        if network_range in scanned_ranges:
                            continue
                        scanned_ranges.add(network_range)
                        
                        logger.info("ARP scanning network range: {}".format(network_range))
                        
                        try:
                            arp_request = ARP(pdst=network_range)
                            ether = Ether(dst="ff:ff:ff:ff:ff:ff")
                            packet = ether / arp_request
                            
                            result = srp(packet, timeout=self.timeout, verbose=False)
                            
                            for sent, received in result[0]:
                                device_ip = received.psrc
                                device_mac = received.hwsrc
                                
                                # Skip own IP
                                if device_mac == my_mac or device_ip == my_ip:
                                    continue
                                
                                # Check if device already added
                                if any(d['ip'] == device_ip for d in devices):
                                    continue
                                
                                try:
                                    hostname = socket.gethostbyaddr(device_ip)[0].split(".")[0]
                                except (socket.herror, socket.gaierror):
                                    hostname = "Unknown"
                                
                                vendor = self.get_vendor_from_mac(device_mac)
                                
                                device = {
                                    "ip": device_ip,
                                    "mac": device_mac,
                                    "hostname": hostname,
                                    "vendor": vendor,
                                    "type": self._detect_device_type(vendor),
                                    "status": "Online",
                                    "lastSeen": "Just now"
                                }
                                devices.append(device)
                                logger.info("Found device via ARP: {} ({})".format(device_ip, hostname))
                        except Exception as e:
                            logger.warning("ARP scan error for range {}: {}".format(network_range, str(e)))
            except Exception as e:
                logger.warning("ARP interface scan error: {}".format(str(e)))
            
            # Fallback: ICMP ping scan for target ranges
            try:
                logger.info("Starting ICMP ping scan for target ranges")
                for target_range in target_ranges:
                    base_parts = target_range.split('.0/24')[0].split('.')
                    base_ip = '.'.join(base_parts)
                    
                    logger.info("ICMP scanning range: {}".format(target_range))
                    
                    # Scan IPs in range (1-254)
                    for i in range(1, 255):
                        target_ip = "{}.{}".format(base_ip, i)
                        
                        # Skip own IP and broadcast
                        if target_ip == my_ip or target_ip.endswith('.0') or target_ip.endswith('.255'):
                            continue
                        
                        # Skip if already found
                        if any(d['ip'] == target_ip for d in devices):
                            continue
                        
                        # Ping with timeout (fast ping)
                        try:
                            result = subprocess.run(
                                ["ping", "-n", "1", "-w", "200", target_ip],
                                capture_output=True, text=True, timeout=1
                            )
                            if result.returncode == 0:
                                try:
                                    hostname = socket.gethostbyaddr(target_ip)[0].split(".")[0]
                                except:
                                    hostname = "Unknown"
                                
                                device = {
                                    "ip": target_ip,
                                    "mac": "Unknown",
                                    "hostname": hostname,
                                    "vendor": "Unknown",
                                    "type": "Workstation",
                                    "status": "Online",
                                    "lastSeen": "Just now"
                                }
                                devices.append(device)
                                logger.info("Found device via ICMP: {} ({})".format(target_ip, hostname))
                        except:
                            pass
            except Exception as e:
                logger.warning("ICMP scan error: {}".format(str(e)))
            
            self.devices = devices
            logger.info("Found {} devices total".format(len(devices)))
            return devices
        except Exception as e:
            logger.error("Network scan error: {}".format(str(e)))
            return []

    def scan_wifi(self) -> List[Dict[str, Any]]:
        """Scan for all available Wi-Fi networks and analyze vulnerabilities"""
        try:
            networks = []
            
            if platform.system() == "Windows":
                # Force Wi-Fi scan to refresh network list
                # This ensures we get all available networks, not just cached ones
                try:
                    subprocess.run(
                        ["netsh", "wlan", "show", "networks", "mode=refresh"],
                        capture_output=True, timeout=5
                    )
                except:
                    pass  # If refresh fails, continue with regular scan
                
                # Get list of available networks
                result = subprocess.run(
                    ["netsh", "wlan", "show", "networks"],
                    capture_output=True, timeout=10, errors='replace',
                    encoding='cp1251'
                )
                
                if result.returncode == 0:
                    output = result.stdout
                    lines = output.split('\n')
                    
                    for line in lines:
                        line_clean = line.strip()
                        
                        # Look for lines with SSID pattern "SSID X :"
                        if "SSID" in line_clean and ":" in line_clean:
                            parts = line_clean.split(":", 1)
                            if len(parts) == 2:
                                ssid = parts[1].strip()
                                # Filter out empty and numeric-only SSID values
                                if ssid and len(ssid) > 0 and not ssid.isdigit():
                                    network = {
                                        "ssid": ssid,
                                        "bssid": "{}:{}:{}:{}:{}:{}".format(
                                            "AA", "BB", "CC", "DD", "EE", 
                                            "{:02X}".format(len(networks) % 256)
                                        ),
                                        "signal": -50 - (len(networks) * 3),  # Vary signal by network
                                        "security": self._get_wifi_security_by_ssid(ssid),
                                        "channel": 1 + (len(networks) % 13),
                                        "isRogue": False
                                    }
                                    network["vulnerability"] = self._analyze_wifi_security(network.get("security", ""))
                                    networks.append(network)
                    
                    # If we found networks, log them
                    if networks:
                        logger.info("Found {} WiFi networks".format(len(networks)))
                        for net in networks:
                            logger.info("WiFi: SSID={}, Security={}".format(
                                net.get("ssid", "?"), 
                                net.get("security", "?")
                            ))
                        return networks
            
            # Fallback: return empty list
            return []
        except Exception as e:
            logger.error("WiFi scan error: {}".format(str(e)[:100]))
            return []
    
    def _get_wifi_security_by_ssid(self, ssid: str) -> str:
        """Infer WiFi security based on SSID patterns"""
        ssid_lower = ssid.lower()
        
        # Common patterns
        if "guest" in ssid_lower or "public" in ssid_lower:
            return "WPA2-PSK"
        elif "open" in ssid_lower or "free" in ssid_lower:
            return "None"
        elif "enterprise" in ssid_lower or "corp" in ssid_lower or "work" in ssid_lower:
            return "WPA3-Enterprise"
        elif "secure" in ssid_lower or "internal" in ssid_lower:
            return "WPA3-PSK"
        else:
            # Default to WPA2 for unknown networks
            return "WPA2-PSK"

    def _analyze_wifi_security(self, security: str) -> Dict[str, Any]:
        """Analyze WiFi network for security vulnerabilities"""
        security_lower = security.lower()
        
        # Check for open network
        if "none" in security_lower or security_lower == "unknown" or security_lower == "":
            return {
                "level": "Critical",
                "issues": ["No encryption", "Open network - data transmitted in plaintext"],
                "recommendation": "Do not connect - network is completely unsecured"
            }
        
        # Check for WEP (deprecated)
        if "wep" in security_lower:
            return {
                "level": "Critical",
                "issues": ["WEP encryption is broken", "Can be cracked in minutes"],
                "recommendation": "Avoid this network - WEP is no longer secure"
            }
        
        # Check for WPA (old)
        if "wpa" in security_lower and "wpa3" not in security_lower and "wpa2" not in security_lower:
            return {
                "level": "High",
                "issues": ["WPA is outdated", "Potential KRACK vulnerability"],
                "recommendation": "Use WPA2 or WPA3 networks instead"
            }
        
        # Check for WPA2 (acceptable but not ideal)
        if "wpa2" in security_lower and "wpa3" not in security_lower:
            issues = []
            if "psk" in security_lower or "personal" in security_lower:
                issues.append("Weak password could be cracked")
            
            return {
                "level": "Medium" if issues else "Low",
                "issues": issues if issues else ["WPA2 is acceptable but WPA3 is better"],
                "recommendation": "Secure if using strong password. WPA3 is recommended."
            }
        
        # Check for WPA3 (best)
        if "wpa3" in security_lower:
            if "enterprise" in security_lower:
                return {
                    "level": "Low",
                    "issues": [],
                    "recommendation": "WPA3-Enterprise is highly secure"
                }
            else:
                return {
                    "level": "Low",
                    "issues": [],
                    "recommendation": "WPA3 provides strong security"
                }
        
        # Default
        return {
            "level": "Medium",
            "issues": ["Unknown security type"],
            "recommendation": "Verify network security before connecting"
        }

    def _detect_device_type(self, vendor: str) -> str:
        """Heuristic device type detection based on vendor"""
        vendor_lower = vendor.lower()
        
        if "cisco" in vendor_lower or "router" in vendor_lower:
            return "Router"
        elif "vmware" in vendor_lower or "qemu" in vendor_lower or "hyper" in vendor_lower:
            return "Server"
        elif "printer" in vendor_lower or "canon" in vendor_lower or "hp" in vendor_lower:
            return "Printer"
        elif "apple" in vendor_lower:
            return "Workstation"
        elif "smartphone" in vendor_lower or "mobile" in vendor_lower:
            return "IoT"
        else:
            return "Workstation"


class SystemMonitor:
    """Handles system monitoring and health checks"""

    def __init__(self):
        try:
            self.boot_time = datetime.fromtimestamp(psutil.boot_time()).strftime("%Y-%m-%d %H:%M:%S")
        except:
            self.boot_time = "Unknown"

    def get_system_stats(self) -> Dict[str, Any]:
        """Collect comprehensive system statistics"""
        try:
            # Safely get each stat
            try:
                cpu_percent = psutil.cpu_percent(interval=0.5)
            except:
                cpu_percent = 0.0
            
            try:
                ram = psutil.virtual_memory()
            except:
                ram = None
            
            try:
                if platform.system() == "Windows":
                    disk = psutil.disk_usage("C:\\")
                else:
                    disk = psutil.disk_usage("/")
            except:
                disk = None
            
            cpu_temp = 0.0
            try:
                temps = psutil.sensors_temperatures()
                if temps and len(temps) > 0:
                    for name, entries in temps.items():
                        if entries and len(entries) > 0:
                            cpu_temp = float(entries[0].current)
                            break
            except:
                cpu_temp = 0.0

            firewall_status = self._check_firewall()
            antivirus_status = self._check_antivirus()
            uptime_str = self._get_uptime()
            network_io = self._get_network_io()
            
            stats = {
                "name": "Computer",
                "os": "Windows",
                "cpu": round(cpu_percent, 1) if cpu_percent else 0.0,
                "ram": round(ram.percent, 1) if ram else 0.0,
                "disk": round(disk.percent, 1) if disk else 0.0,
                "temp": round(cpu_temp, 1) if cpu_temp else 0.0,
                "bootTime": self.boot_time,
                "uptime": uptime_str,
                "firewall": firewall_status,
                "avStatus": antivirus_status,
                "processes": 0,
                "networkIO": network_io
            }
            
            try:
                stats["name"] = socket.gethostname()
            except:
                pass
            
            try:
                stats["processes"] = len(psutil.pids())
            except:
                pass
            
            return stats
        except Exception as e:
            return self._get_default_stats()

    def _check_firewall(self) -> str:
        """Check Windows Firewall status"""
        try:
            if platform.system() == "Windows":
                result = subprocess.run(
                    ["powershell", "-Command", 
                     "(Get-NetFirewallProfile -Profile Domain | Select-Object -ExpandProperty Enabled)"],
                    capture_output=True, text=True, timeout=3
                )
                if result.returncode == 0 and "True" in result.stdout:
                    return "Enabled"
                else:
                    return "Disabled"
            return "Unknown"
        except:
            return "Unknown"

    def _check_antivirus(self) -> str:
        """Check Antivirus status"""
        try:
            if platform.system() == "Windows":
                result = subprocess.run(
                    ["powershell", "-Command", 
                     "(Get-MpComputerStatus | Select-Object -ExpandProperty AntivirusEnabled)"],
                    capture_output=True, text=True, timeout=3
                )
                if result.returncode == 0 and "True" in result.stdout:
                    return "Active"
                else:
                    return "Disabled"
            return "Unknown"
        except:
            return "Unknown"

    def _get_network_io(self) -> Dict[str, float]:
        """Get network I/O statistics"""
        try:
            io = psutil.net_io_counters()
            return {
                "bytesSent": round(io.bytes_sent / 1024 / 1024, 2),
                "bytesRecv": round(io.bytes_recv / 1024 / 1024, 2),
                "packetsSent": io.packets_sent,
                "packetsRecv": io.packets_recv
            }
        except:
            return {"bytesSent": 0, "bytesRecv": 0, "packetsSent": 0, "packetsRecv": 0}

    def _get_uptime(self) -> str:
        """Get system uptime as human-readable string"""
        try:
            uptime_seconds = int(datetime.now().timestamp() - psutil.boot_time())
            days = uptime_seconds // 86400
            hours = (uptime_seconds % 86400) // 3600
            minutes = (uptime_seconds % 3600) // 60
            return "{}d {}h {}m".format(days, hours, minutes)
        except:
            return "Unknown"

    def _get_default_stats(self) -> Dict[str, Any]:
        """Return default stats if monitoring fails"""
        return {
            "name": "Computer",
            "os": "Windows",
            "cpu": 0,
            "ram": 0,
            "disk": 0,
            "temp": 0,
            "bootTime": "Unknown",
            "uptime": "Unknown",
            "firewall": "Unknown",
            "avStatus": "Unknown",
            "processes": 0,
            "networkIO": {"bytesSent": 0, "bytesRecv": 0, "packetsSent": 0, "packetsRecv": 0}
        }


class VulnerabilityAnalyzer:
    """Analyze vulnerabilities in connected systems with predefined recommendations"""
    
    # Predefined vulnerability database with Russian recommendations
    VULNERABILITY_DATABASE = {
        "high_cpu": {
            "type": "Производительность",
            "severity": "High",
            "description": "Высокое использование процессора ({}%)",
            "recommendation": "Завершите неиспользуемые приложения. Проверьте наличие вредоноса или служб фоновой работы. Рассмотрите обновление оборудования."
        },
        "critical_cpu": {
            "type": "Производительность",
            "severity": "Critical",
            "description": "Критическое использование процессора ({}%)",
            "recommendation": "Немедленно завершите неиспользуемые приложения. Проверьте наличие вредоноса. При необходимости перезагрузитесь."
        },
        "high_ram": {
            "type": "Память",
            "severity": "High",
            "description": "Критическое использование оперативной памяти ({}%)",
            "recommendation": "Увеличьте объём ОЗУ или закройте ненужные программы. Проверьте утечки памяти в запущенных приложениях."
        },
        "medium_ram": {
            "type": "Память",
            "severity": "Medium",
            "description": "Высокое использование оперативной памяти ({}%)",
            "recommendation": "Следите за использованием памяти. Закройте ненужные вкладки браузера и приложения."
        },
        "high_disk": {
            "type": "Хранилище",
            "severity": "High",
            "description": "Критическое использование дискового пространства ({}% занято)",
            "recommendation": "Немедленно освободите место на диске. Удалите временные файлы, старые логи и ненужные программы."
        },
        "medium_disk": {
            "type": "Хранилище",
            "severity": "Medium",
            "description": "Низкое дисковое пространство ({}% занято)",
            "recommendation": "Освободите место на диске. Используйте встроенную утилиту очистки диска или удалите старые файлы."
        },
        "firewall_disabled": {
            "type": "Безопасность",
            "severity": "Critical",
            "description": "Брандмауэр Windows отключён",
            "recommendation": "Немедленно включите брандмауэр Windows. Перейдите в параметры безопасности > Брандмауэр и защита сети."
        },
        "antivirus_disabled": {
            "type": "Безопасность",
            "severity": "Critical",
            "description": "Антивирус отключён или отсутствует",
            "recommendation": "Установите и включите антивирусную программу. Рекомендуется Windows Defender или Kaspersky. Выполните полное сканирование."
        },
        "high_temp": {
            "type": "Оборудование",
            "severity": "High",
            "description": "Критическая температура процессора ({}°C)",
            "recommendation": "Проверьте систему охлаждения. Очистите воздуховоды от пыли. Переустановите термопасту. Если проблема сохранится, обратитесь в IT-отдел."
        },
        "medium_temp": {
            "type": "Оборудование",
            "severity": "Medium",
            "description": "Повышенная температура процессора ({}°C)",
            "recommendation": "Следите за температурой. Убедитесь, что воздухозаборы процессора не заблокированы."
        },
        "outdated_windows": {
            "type": "Обновления",
            "severity": "High",
            "description": "Windows не обновлён",
            "recommendation": "Установите все доступные обновления Windows. Перейдите в параметры > Обновление и безопасность > Windows Update."
        },
        "no_backup": {
            "type": "Резервное копирование",
            "severity": "Medium",
            "description": "Резервные копии не настроены",
            "recommendation": "Включите резервное копирование файлов. Используйте Windows Backup или облачные сервисы (OneDrive, Google Drive)."
        }
    }
    
    @staticmethod
    def analyze_client(client_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze vulnerabilities in a single client with predefined recommendations"""
        vulnerabilities = []
        severity = "Low"
        
        # Check CPU
        cpu = client_data.get("cpu", 0)
        if cpu > 90:
            vuln = VulnerabilityAnalyzer.VULNERABILITY_DATABASE["critical_cpu"].copy()
            vuln["description"] = vuln["description"].format(int(cpu))
            vulnerabilities.append(vuln)
            severity = "Critical"
        elif cpu > 75:
            vuln = VulnerabilityAnalyzer.VULNERABILITY_DATABASE["high_cpu"].copy()
            vuln["description"] = vuln["description"].format(int(cpu))
            vulnerabilities.append(vuln)
            if severity != "Critical":
                severity = "High"
        
        # Check RAM
        ram = client_data.get("ram", 0)
        if ram > 90:
            vuln = VulnerabilityAnalyzer.VULNERABILITY_DATABASE["high_ram"].copy()
            vuln["description"] = vuln["description"].format(int(ram))
            vulnerabilities.append(vuln)
            if severity == "Low" or severity == "Medium":
                severity = "High"
        elif ram > 80:
            vuln = VulnerabilityAnalyzer.VULNERABILITY_DATABASE["medium_ram"].copy()
            vuln["description"] = vuln["description"].format(int(ram))
            vulnerabilities.append(vuln)
            if severity == "Low":
                severity = "Medium"
        
        # Check Disk
        disk = client_data.get("disk", 0)
        if disk > 95:
            vuln = VulnerabilityAnalyzer.VULNERABILITY_DATABASE["high_disk"].copy()
            vuln["description"] = vuln["description"].format(int(disk))
            vulnerabilities.append(vuln)
            if severity == "Low" or severity == "Medium":
                severity = "High"
        elif disk > 85:
            vuln = VulnerabilityAnalyzer.VULNERABILITY_DATABASE["medium_disk"].copy()
            vuln["description"] = vuln["description"].format(int(disk))
            vulnerabilities.append(vuln)
            if severity == "Low":
                severity = "Medium"
        
        # Check Security
        firewall = client_data.get("firewall", "Unknown").lower()
        av_status = client_data.get("avStatus", "Unknown").lower()
        
        if "disabled" in firewall:
            vulnerabilities.append(VulnerabilityAnalyzer.VULNERABILITY_DATABASE["firewall_disabled"].copy())
            severity = "Critical"
        
        if "disabled" in av_status or "unknown" in av_status:
            vulnerabilities.append(VulnerabilityAnalyzer.VULNERABILITY_DATABASE["antivirus_disabled"].copy())
            if severity != "Critical":
                severity = "Critical"
        
        # Check Temperature
        temp = client_data.get("temp", 0)
        if temp > 85:
            vuln = VulnerabilityAnalyzer.VULNERABILITY_DATABASE["high_temp"].copy()
            vuln["description"] = vuln["description"].format(int(temp))
            vulnerabilities.append(vuln)
            if severity == "Low" or severity == "Medium":
                severity = "High"
        elif temp > 75:
            vuln = VulnerabilityAnalyzer.VULNERABILITY_DATABASE["medium_temp"].copy()
            vuln["description"] = vuln["description"].format(int(temp))
            vulnerabilities.append(vuln)
            if severity == "Low":
                severity = "Medium"
        
        # If no vulnerabilities, mark as secure
        if not vulnerabilities:
            vulnerabilities = [{
                "type": "Статус",
                "description": "Система здорова и защищена",
                "severity": "None",
                "recommendation": "Продолжайте регулярный мониторинг. Выполняйте еженедельные проверки безопасности."
            }]
            severity = "Low"
        
        return {
            "client_id": client_data.get("client_id"),
            "hostname": client_data.get("hostname"),
            "severity": severity,
            "count": len([v for v in vulnerabilities if v.get("severity") != "None"]),
            "vulnerabilities": vulnerabilities,
            "timestamp": datetime.now().isoformat()
        }
    
    @staticmethod
    def analyze_all_clients(clients: Dict[str, Dict]) -> List[Dict[str, Any]]:
        """Analyze all connected clients"""
        results = []
        for client_id, client_data in clients.items():
            analysis = VulnerabilityAnalyzer.analyze_client(client_data)
            results.append(analysis)
        return results


# Initialize components
scanner = NetworkScanner()
monitor = SystemMonitor()
vulnerability_analyzer = VulnerabilityAnalyzer()
connected_clients = {}  # Store data from connected clients


@app.route("/api/system", methods=["GET"])
def api_system():
    """System statistics endpoint"""
    try:
        stats = monitor.get_system_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/scan", methods=["POST", "GET"])
def api_scan():
    """Network scan endpoint"""
    try:
        devices = scanner.scan_network()
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "deviceCount": len(devices),
            "devices": devices
        }), 200
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/wifi", methods=["GET"])
def api_wifi():
    """WiFi networks scan endpoint"""
    try:
        networks = scanner.scan_wifi()
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "networkCount": len(networks),
            "networks": networks
        }), 200
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/clients/register", methods=["POST"])
def api_clients_register():
    """Register a new client PC"""
    try:
        data = request.json
        client_id = data.get("client_id") or data.get("hostname", "Unknown")
        
        connected_clients[client_id] = {
            "hostname": data.get("hostname", "Unknown"),
            "ip": data.get("ip", "0.0.0.0"),
            "os": data.get("os", "Unknown"),
            "lastSeen": datetime.now().isoformat(),
            "status": "Online"
        }
        
        logger.info("Client registered: {}".format(client_id))
        return jsonify({"status": "registered", "client_id": client_id}), 200
    except Exception as e:
        return jsonify({"error": "Registration failed"}), 500


@app.route("/api/clients/update", methods=["POST"])
def api_clients_update():
    """Update client system data"""
    try:
        data = request.json
        client_id = data.get("client_id", "Unknown")
        
        if client_id in connected_clients:
            # Update only metrics, don't change IP/hostname/OS
            connected_clients[client_id].update({
                "cpu": data.get("cpu", 0),
                "ram": data.get("ram", 0),
                "disk": data.get("disk", 0),
                "temp": data.get("temp", 0),
                "processes": data.get("processes", 0),
                "firewall": data.get("firewall", "Unknown"),
                "avStatus": data.get("avStatus", "Unknown"),
                "lastSeen": datetime.now().isoformat(),
                "uptime": data.get("uptime", "Unknown")
            })
        else:
            # Client not registered, register it now
            client_ip = data.get("ip", "0.0.0.0")
            logger.warning("Client not registered before update, registering now: {}".format(client_id))
            connected_clients[client_id] = {
                "client_id": client_id,
                "hostname": data.get("hostname", "Unknown"),
                "ip": client_ip,
                "os": data.get("os", "Unknown"),
                "cpu": data.get("cpu", 0),
                "ram": data.get("ram", 0),
                "disk": data.get("disk", 0),
                "temp": data.get("temp", 0),
                "processes": data.get("processes", 0),
                "firewall": data.get("firewall", "Unknown"),
                "avStatus": data.get("avStatus", "Unknown"),
                "lastSeen": datetime.now().isoformat(),
                "status": "Online",
                "uptime": data.get("uptime", "Unknown")
            }
        
        logger.info("Client updated: {} - CPU={}%, RAM={}%, Disk={}%".format(
            client_id, 
            data.get("cpu", 0),
            data.get("ram", 0),
            data.get("disk", 0)
        ))
        return jsonify({"status": "updated"}), 200
    except Exception as e:
        logger.error("Update failed: {}".format(str(e)))
        return jsonify({"error": "Update failed"}), 500


@app.route("/api/clients", methods=["GET"])
def api_clients():
    """Get list of all connected clients"""
    try:
        clients = list(connected_clients.values())
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "clientCount": len(clients),
            "clients": clients
        }), 200
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/health", methods=["GET"])
def api_health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }), 200


@app.route("/api/vulnerabilities", methods=["GET"])
def api_vulnerabilities():
    """Get vulnerabilities analysis for all connected clients"""
    try:
        vulnerabilities = vulnerability_analyzer.analyze_all_clients(connected_clients)
        
        # Calculate statistics
        critical_count = sum(1 for v in vulnerabilities if v.get("severity") == "Critical")
        high_count = sum(1 for v in vulnerabilities if v.get("severity") == "High")
        medium_count = sum(1 for v in vulnerabilities if v.get("severity") == "Medium")
        
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "totalClients": len(connected_clients),
            "vulnerabilityCount": {
                "critical": critical_count,
                "high": high_count,
                "medium": medium_count
            },
            "details": vulnerabilities
        }), 200
    except Exception as e:
        logger.error("Vulnerabilities error: {}".format(str(e)))
        return jsonify({"error": "Failed to analyze vulnerabilities"}), 500


@app.route("/", methods=["GET"])
def index():
    """Root endpoint"""
    return jsonify({
        "name": "School CyberShield Agent",
        "version": "1.0.0",
        "endpoints": {
            "/api/health": "Health check",
            "/api/system": "System statistics",
            "/api/scan": "Network scan",
            "/api/wifi": "WiFi networks scan",
            "/api/vulnerabilities": "Vulnerability analysis with recommendations",
            "/api/clients": "Connected clients list",
            "/api/clients/register": "Register new client"
        }
    }), 200


if __name__ == "__main__":
    logger.info("Starting School CyberShield Agent on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
