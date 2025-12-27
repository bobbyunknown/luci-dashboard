<?php
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Content-Type: application/json; charset=utf-8");

/**
 * Function to get online users count
 * @return int Number of online users detected via DHCP leases
 */
function getOnlineUsers() {
    $onlineUsers = 0;
    
    if (function_exists('shell_exec')) {
        // Get the number of DHCP leases from OpenWrt
        $result = shell_exec('cat /tmp/dhcp.leases | wc -l');
        if ($result !== null) {
            $onlineUsers = (int)trim($result);
        }
    }
    
    return $onlineUsers;
}

/**
 * Function to check connection status
 * @return array Connection status information
 */
function checkConnection() {
    // URL to test connection with (Google DNS server is commonly used)
    $testUrl = 'https://8.8.8.8';
    $timeout = 5; // Timeout in seconds
    
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $testUrl);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    
    // Execute the request
    $result = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    
    // Check if connection is successful
    $isConnected = ($httpCode >= 200 && $httpCode < 400 && empty($error));
    
    return [
        'status' => $isConnected ? 'Connected' : 'Disconnected',
        'icon_class' => $isConnected ? 'fa-check bg-gradient-primary' : 'fa-times bg-gradient-danger'
    ];
}

/**
 * Function to get public IP information
 * @return array Public IP and ISP information
 */
function getPublicIP() {
    $ipInfo = [
        'ip' => 'Unknown',
        'isp' => 'Unknown'
    ];
    
    // Use /etc/resinfo directory to store public IP data
    $cacheDir = '/etc/resinfo';
    if (!is_dir($cacheDir)) {
        // Create directory if it doesn't exist with permission 755
        @mkdir($cacheDir, 0755, true);
    }
    
    $cacheFile = $cacheDir . '/public_ip_cache.json';
    $cacheExpiry = 300; // 5 minutes cache
    
    // Check if we have a valid cache
    if (file_exists($cacheFile)) {
        $cacheData = json_decode(file_get_contents($cacheFile), true);
        if ($cacheData && isset($cacheData['ip']) && isset($cacheData['timestamp']) && 
            (time() - $cacheData['timestamp'] < $cacheExpiry)) {
            // Return cached IP info if still valid
            return $cacheData;
        }
    }
    
    // Use only ip-api.com for efficiency
    try {
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, 'http://ip-api.com/json/');
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_TIMEOUT, 5);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        
        if ($response && $httpCode >= 200 && $httpCode < 300) {
            $data = json_decode($response, true);
            if (!empty($data) && isset($data['query'])) {
                $ipInfo['ip'] = $data['query'];
                $ipInfo['isp'] = $data['isp'] ?? 'Unknown';
                
                // Cache the result
                $ipInfo['timestamp'] = time();
                file_put_contents($cacheFile, json_encode($ipInfo));
            }
        }
    } catch (Exception $e) {
        // Just return the default 'Unknown' values
    }
    
    return $ipInfo;
}

/**
 * Function to get ping time using httping or curl
 * @param string $host Host to ping (default: google.com)
 * @return string Ping time in 'xx ms' format or 'Timeout'
 */
function getPingTime($host = 'google.com') {
    // Default value if ping fails
    $pingTime = 'Timeout';
    
    // Check for cached ping data
    $cacheDir = '/etc/resinfo';
    if (!is_dir($cacheDir)) {
        // Create directory if it doesn't exist with permission 755
        @mkdir($cacheDir, 0755, true);
    }
    
    // Use httping which is installed on OpenWrt
    if (function_exists('exec')) {
        // Make sure host is in the correct format (without protocol)
        $host = preg_replace('#^https?://#', '', $host);
        
        // -c 1: just one request
        // -t 2: timeout 2 seconds
        // -G: use GET method, not HEAD
        // -s: silent mode, for minimal logging
        $cmd = "/usr/bin/httping -c 1 -t 2 -G -s " . escapeshellarg($host);
        
        // Capture output and exit code
        exec($cmd . " 2>&1", $outputArray, $returnCode);
        
        // If httping succeeds
        if ($returnCode === 0) {
            // Parse httping output to get time
            $pingTimePattern = '/time=([0-9.]+) ms/i';
            foreach ($outputArray as $line) {
                if (preg_match($pingTimePattern, $line, $matches)) {
                    // Format with 1 decimal place
                    $pingTime = number_format((float)$matches[1], 1) . ' ms';
                    break;
                }
            }
        }
    }
    
    // Fallback to curl if httping fails
    if ($pingTime === 'Timeout') {
        $url = 'http://' . $host;
        $startTime = microtime(true);
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_TIMEOUT, 2);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_NOBODY, true); // HEAD request only
        curl_exec($curl);
        $error = curl_errno($curl);
        curl_close($curl);
        
        // If successful, calculate the time
        if ($error === 0) {
            $endTime = microtime(true);
            $pingTime = number_format(($endTime - $startTime) * 1000, 1) . ' ms';
        }
    }
    
    return $pingTime;
}

/**
 * Function to get running services using ps command
 * @return array List of running services with PID, name, status, and memory usage
 */
function getRunningServices() {
    $services = [];
    
    if (function_exists('shell_exec')) {
        // Use ps command to get running processes (OpenWrt doesn't support ps aux)
        $result = shell_exec('ps | grep -v "^\s*PID"');
        
        if ($result) {
            $lines = explode("\n", trim($result));
            
            foreach ($lines as $line) {
                // Parse the ps output
                $parts = preg_split('/\s+/', trim($line), 5);
                if (count($parts) >= 5) {
                    $pid = $parts[0];
                    $command = $parts[4];
                    
                    // Skip grep and ps processes
                    if (strpos($command, 'grep') !== false || strpos($command, 'ps') === 0) {
                        continue;
                    }
                    
                    // Get service name (first word of command)
                    $serviceName = explode(' ', $command)[0];
                    $serviceName = basename($serviceName);
                    
                    // Get memory usage for this PID
                    $memoryUsage = 'N/A';
                    $memoryCmd = "cat /proc/$pid/status | grep VmRSS | awk '{print \$2}'";
                    $memoryResult = shell_exec($memoryCmd);
                    if ($memoryResult) {
                        $memoryKb = (int)trim($memoryResult);
                        if ($memoryKb > 1024) {
                            $memoryUsage = round($memoryKb / 1024, 1) . ' MB';
                        } else {
                            $memoryUsage = $memoryKb . ' KB';
                        }
                    }
                    
                    // Only include important system services
                    $importantServices = [
                        'dropbear', 'dnsmasq', 'uhttpd', 'hostapd', 'wpa_supplicant',
                        'odhcpd', 'rpcd', 'netifd', 'ubusd', 'logd', 'ntpd',
                        'xray', 'mihomo', 'sing-box', 'tailscale', 'cloudflared', 'ngrok',
                        'openvpn', 'wireguard', 'sshd', 'nginx', 'php-fpm', 'php-cgi',
                        'luci', 'cron', 'udhcpc', 'pppd', 'xl2tpd'
                    ];
                    
                    // Check if this is an important service or a custom service
                    $isImportant = false;
                    foreach ($importantServices as $service) {
                        if (strpos($serviceName, $service) !== false) {
                            $isImportant = true;
                            break;
                        }
                    }
                    
                    // Add to services array if it's important
                    if ($isImportant) {
                        $services[] = [
                            'pid' => $pid,
                            'name' => $serviceName,
                            'command' => $command,
                            'status' => 'running',
                            'memory' => $memoryUsage
                        ];
                    }
                }
            }
            
            // Sort by memory usage (highest first)
            usort($services, function($a, $b) {
                $aMemory = (int)str_replace(['MB', 'KB', ' '], '', $a['memory']);
                $bMemory = (int)str_replace(['MB', 'KB', ' '], '', $b['memory']);
                
                // Convert KB to MB for comparison
                if (strpos($a['memory'], 'KB') !== false) $aMemory /= 1024;
                if (strpos($b['memory'], 'KB') !== false) $bMemory /= 1024;
                
                return $bMemory <=> $aMemory;
            });
            
            // Limit to top 20 services
            $services = array_slice($services, 0, 20);
        }
    }
    
    return $services;
}

/**
 * Function to get system logs using logread command
 * @param int $lines Number of lines to return (default: 50)
 * @return string System logs
 */
function getSystemLogs($lines = 50) {
    $logs = "No logs available";
    
    if (function_exists('shell_exec')) {
        // Use logread command to get system logs
        $result = shell_exec("logread | tail -n $lines");
        
        if ($result) {
            $logs = trim($result);
        }
    }
    
    return $logs;
}

echo '{';
$cnt = 0;
if (isset($_GET['network'])) {
    $dt = $_GET['network'];
    if ($dt === "device") {
        // Get device information
        $deviceQuery = shell_exec("ubus call network.device status");
        $deviceData = json_decode($deviceQuery, true);
        
        // Get interface information
        $interfaceQuery = shell_exec("ubus call network.interface dump");
        $interfaceData = json_decode($interfaceQuery, true);
        
        // Combine the data
        $combinedData = array();
        
        if (!empty($deviceData) && !empty($interfaceData) && isset($interfaceData['interface'])) {
            // Create a mapping of device names to interface data
            $interfaceMap = array();
            foreach ($interfaceData['interface'] as $interface) {
                if (isset($interface['device'])) {
                    $interfaceMap[$interface['device']] = $interface;
                }
                // Also map l3_device if different from device
                if (isset($interface['l3_device']) && isset($interface['device']) && $interface['l3_device'] != $interface['device']) {
                    $interfaceMap[$interface['l3_device']] = $interface;
                }
            }
            
            // Enrich device data with interface data
            foreach ($deviceData as $deviceName => $deviceInfo) {
                // Add interface data if available
                if (isset($interfaceMap[$deviceName])) {
                    $interfaceInfo = $interfaceMap[$deviceName];
                    
                    // Add IPv4 address
                    if (isset($interfaceInfo['ipv4-address']) && !empty($interfaceInfo['ipv4-address'])) {
                        $deviceInfo['ipv4_address'] = $interfaceInfo['ipv4-address'][0]['address'];
                    }
                    
                    // Add IPv6 address
                    if (isset($interfaceInfo['ipv6-address']) && !empty($interfaceInfo['ipv6-address'])) {
                        $deviceInfo['ipv6_address'] = $interfaceInfo['ipv6-address'][0]['address'];
                    }
                    
                    // Add DNS servers
                    if (isset($interfaceInfo['dns-server'])) {
                        $deviceInfo['dns'] = $interfaceInfo['dns-server'];
                    }
                    
                    // Add metrics
                    if (isset($interfaceInfo['metric'])) {
                        $deviceInfo['metric'] = $interfaceInfo['metric'];
                    }
                    
                    if (isset($interfaceInfo['dns_metric'])) {
                        $deviceInfo['dns_metric'] = $interfaceInfo['dns_metric'];
                    }
                    
                    // Add protocol
                    if (isset($interfaceInfo['proto'])) {
                        $deviceInfo['protocol'] = $interfaceInfo['proto'];
                    }
                    
                    // Add uptime
                    if (isset($interfaceInfo['uptime'])) {
                        $deviceInfo['uptime'] = $interfaceInfo['uptime'];
                    }
                    
                    // Add interface name
                    if (isset($interfaceInfo['interface'])) {
                        $deviceInfo['interface_name'] = $interfaceInfo['interface'];
                    }
                    
                    // Add autostart
                    if (isset($interfaceInfo['autostart'])) {
                        $deviceInfo['autostart'] = $interfaceInfo['autostart'];
                    }
                }
                
                $combinedData[$deviceName] = $deviceInfo;
            }
                
            echo '"network":{"status": true, "data":[';
            echo json_encode($combinedData);
            echo '], "error": null},';
        } else {
            // Fallback to original device data if something went wrong
            echo '"network":{"status": true, "data":[';
            echo $deviceQuery;
            echo '], "error": null},';
        }
    } else if ($dt === "getCPUInfo") {
        $query = shell_exec("ubus call luci getCPUInfo");
        echo '"luci":{"status": true, "data":[';
        if (empty($query)) {
            echo '], "error":"query error"},';
        } else {
            echo $query;
            echo '], "error": null},';
        }
    } else if ($dt === "getTempInfo") {
        $query = shell_exec("ubus call luci getTempInfo");
        echo '"luci":{"status": true, "data":[';
        if (empty($query)) {
            echo '], "error":"query error"},';
        } else {
            echo $query;
            echo '], "error": null},';
        }
    } else if ($dt === "getStorage") {
        // Get storage information
        $rootInfo = array();
        
        // Get root filesystem information
        if (function_exists('disk_free_space') && function_exists('disk_total_space')) {
            $rootInfo['root'] = array(
                'total' => round(disk_total_space('/') / 1024),  // in KB
                'free' => round(disk_free_space('/') / 1024)    // in KB
            );
        } else if (function_exists('shell_exec')) {
            // Fallback to df command if PHP functions are not available
            $df = shell_exec('df -k / | tail -n1');
            if ($df) {
                $parts = preg_split('/\s+/', trim($df));
                if (count($parts) >= 6) {
                    $rootInfo['root'] = array(
                        'total' => intval($parts[1]),  // in KB
                        'free' => intval($parts[3])    // in KB
                    );
                }
            }
        }
        
        echo '"luci":{"status": true, "data":[' . json_encode($rootInfo) . '], "error": null},';
    } else {
        // Get specific interface information
        $query = shell_exec("ubus call network.interface.$dt status");
        echo '"network":{"status": true, "data":[';
        if (empty($query)) {
            echo '], "error":"interface not found"},';
        } else {
            echo $query;
            echo '], "error": null},';
        }
    }
} else {
    echo '"network":{"status": false, "data":[ ], "error":"no data"},';
    $cnt++;
}

if (isset($_GET['system'])) {
    $dt = $_GET['system'];
    echo '"system":{"status": true, "data":[';
    $query = shell_exec("ubus call system $dt");
    if (empty($query)) {
        echo '], "error":"parameter not found"},';
    } else {
        echo $query;
        echo '], "error": null},';
    }
} else {
    echo '"system":{"status": false, "data":[ ], "error":"no data"},';
    $cnt++;
}

if (isset($_GET['luci'])) {
    $dt = $_GET['luci'];
    echo '"luci":{"status": true, "data":[';
    
    if ($dt === "getTunnelStatus") {
        // Get tunnel services status
        $tunnelServices = array(
            'xray' => array('name' => 'Xray', 'running' => false),
            'mihomo' => array('name' => 'Mihomo', 'running' => false),
            'sing-box' => array('name' => 'Sing-Box', 'running' => false),
            'tailscale' => array('name' => 'Tailscale', 'running' => false),
            'cloudflared' => array('name' => 'Cloudflared', 'running' => false),
            'ngrok' => array('name' => 'Ngrok', 'running' => false)
        );
        
        // Mapping nama service ke nama executable yang lebih spesifik
        $executableMap = array(
            'xray' => 'xray',
            'mihomo' => 'mihomo',
            'sing-box' => 'sing-box',
            'tailscale' => 'tailscaled',
            'cloudflared' => 'cloudflared',
            'ngrok' => 'ngrok'
        );
        
        // Check each service status using pidof
        foreach ($tunnelServices as $service => &$info) {
            $executable = isset($executableMap[$service]) ? $executableMap[$service] : $service;
            // Gunakan pidof untuk pengecekan yang lebih akurat
            $cmd = "pidof " . escapeshellarg($executable) . " > /dev/null 2>&1; echo $?";
            $exitCode = (int)trim(shell_exec($cmd));
            // Jika exit code 0, berarti proses ditemukan (running)
            $info['running'] = ($exitCode === 0);
        }
        
        echo json_encode($tunnelServices);
        echo '], "error": null},';
    } else {
        $query = shell_exec("ubus call luci $dt");
        if (empty($query)) {
            echo '], "error":"parameter not found"},';
        } else {
            echo $query;
            echo '], "error": null},';
        }
    }
} else {
    echo '"luci":{"status": false, "data":[ ], "error":"no data"},';
    $cnt++;
}

if (isset($_GET['vnstat'])) {
    $dt = $_GET['vnstat'];
    echo '"vnstat":{"status": true, "data":[';
    $query = shell_exec("vnstat --json -i $dt");
    if (empty($query)) {
        echo '], "error":"interface not found"}';
    } else {
        // Parse JSON untuk mendapatkan data interface yang diminta
        $data = json_decode($query, true);
        if ($data && isset($data['interfaces'])) {
            // Cari interface yang sesuai
            foreach ($data['interfaces'] as $interface) {
                if ($interface['name'] === $dt) {
                    // Hanya tampilkan data traffic dari interface yang diminta
                    echo json_encode($interface['traffic']);
                    break;
                }
            }
        }
        echo '], "error": null},';
    }
} else {
    echo '"vnstat":{"status": false, "data":[ ], "error":"no data"},';
    $cnt++;
}

if (isset($_GET['users'])) {
    $action = $_GET['users'];
    echo '"users":{"status": true, "data":[';
    if ($action === "online") {
        $onlineUsers = getOnlineUsers();
        echo '{"online": ' . $onlineUsers . '}';
    } else {
        echo '{"error": "unknown action"}';
    }
    echo '], "error": null},';
} else {
    echo '"users":{"status": false, "data":[ ], "error":"no data"},';
    $cnt++;
}

if (isset($_GET['connection'])) {
    if (isset($_GET['connection']) && $_GET['connection'] === "status") {
        $connectionStatus = checkConnection();
        echo '"connection":{"status": true, "data":[' . json_encode($connectionStatus) . '], "error": null},';
    } else {
        echo '"connection":{"status": false, "data":[ ], "error":"invalid parameter"},';
    }
} else {
    echo '"connection":{"status": false, "data":[ ], "error":"no data"},';
    $cnt++;
}

if (isset($_GET['publicip'])) {
    if (isset($_GET['publicip']) && $_GET['publicip'] === "info") {
        $publicIP = getPublicIP();
        echo '"publicip":{"status": true, "data":[' . json_encode($publicIP) . '], "error": null},';
    } else {
        echo '"publicip":{"status": false, "data":[ ], "error":"invalid parameter"},';
    }
} else {
    echo '"publicip":{"status": false, "data":[ ], "error":"no data"},';
    $cnt++;
}

if (isset($_GET['ping'])) {
    if (isset($_GET['ping']) && $_GET['ping'] === "time") {
        $host = isset($_GET['host']) ? $_GET['host'] : 'google.com';
        $pingTime = getPingTime($host);
        echo '"ping":{"status": true, "data":[{"time": "' . $pingTime . '"}], "error": null},';
    } else {
        echo '"ping":{"status": false, "data":[ ], "error":"invalid parameter"},';
    }
} else {
    echo '"ping":{"status": false, "data":[ ], "error":"no data"},';
    $cnt++;
}

// New endpoint for running services
if (isset($_GET['services'])) {
    if (isset($_GET['services']) && $_GET['services'] === "running") {
        $services = getRunningServices();
        echo '"services":{"status": true, "data":' . json_encode($services) . ', "error": null},';
    } else {
        echo '"services":{"status": false, "data":[ ], "error":"invalid parameter"},';
    }
} else {
    echo '"services":{"status": false, "data":[ ], "error":"no data"},';
    $cnt++;
}

// New endpoint for system logs
if (isset($_GET['logs'])) {
    if (isset($_GET['logs']) && $_GET['logs'] === "system") {
        $lines = isset($_GET['lines']) ? (int)$_GET['lines'] : 50;
        $logs = getSystemLogs($lines);
        echo '"logs":{"status": true, "data":[{"content": ' . json_encode($logs) . '}], "error": null},';
    } else {
        echo '"logs":{"status": false, "data":[ ], "error":"invalid parameter"},';
    }
} else {
    echo '"logs":{"status": false, "data":[ ], "error":"no data"},';
    $cnt++;
}

if (isset($_GET['netdata'])) {
    $dt = $_GET['netdata'];
    $showData = '0';
    if (isset($_GET['data'])) {
        $dt2 = $_GET['data'];
        if ($dt2 === "all") {
            $showData = "1";
        } else {
            $showData = "0";
        }
    }
    echo '"netdata":{"status": true, "data":[';
    netdataParse($dt, $showData);
} else {
    echo '"netdata":{"status": false, "data":[ ], "error":"no data"}';
    $cnt++;
}
echo '}';
function netdataParse($param, $cond)
{
    if ($param === "info") {
        $getData = file_get_contents("http://127.0.0.1:19999/api/v1/info");
        echo $getData;
        echo '], "error": null}';
    }
    else if ($param === "temp") {
        $rawDt = shell_exec("cat /sys/class/thermal/thermal_zone0/temp | awk '{print $1}'");
        $jsDt = "{ \"temp\": $rawDt } ], \"error\":\"null\"}";
        echo $jsDt;
    } else {
        $rawr = shell_exec("curl http://127.0.0.1:19999/api/v1/data?chart=$param");
        if ($cond === "1") {
            if ($rawr === "Chart is not found: $param") {
                echo '], "error":"parameter not found"}';
            } else {
                $getData = file_get_contents("http://127.0.0.1:19999/api/v1/data?chart=$param");
                echo $getData;
                echo '], "error": null}';
            }
        } else {
            if ($rawr === "Chart is not found: $param") {
                echo '], "error":"parameter not found"}';
            } else {
                $getData = file_get_contents("http://127.0.0.1:19999/api/v1/data?chart=$param&after=-1");
                echo $getData;
                echo '], "error": null}';
            }
        }
    }
}
?>