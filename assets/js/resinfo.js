// Network Traffic Monitor JavaScript
// Simplified version for new API integration

// Global variables for system information
let lastUpdateTime = 0;

// Function to convert seconds to a readable time format (Xd Xh Xm)
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
}

// Function to update online users count
function updateOnlineUsers(data) {
    if (data.users && data.users.status && data.users.data && data.users.data.length > 0) {
        const userData = data.users.data[0];
        if (userData.online !== undefined) {
            const onlineUsersElement = document.getElementById('online-users');
            if (onlineUsersElement) {
                onlineUsersElement.textContent = userData.online;
                
                // Assume a maximum of 50 users for the progress bar (adjust as needed)
                const maxUsers = 50;
                const percentage = Math.min(100, (userData.online / maxUsers) * 100);
                
                // Update progress bar
                const usersProgressBar = document.querySelector('.users-progress-bar');
                if (usersProgressBar) {
                    usersProgressBar.style.width = `${percentage}%`;
                    usersProgressBar.setAttribute('aria-valuenow', percentage);
                }
            }
        }
    }
}

// Function to update system information
function updateSystemInfo(data) {
    // Update system data from system endpoint
    if (data.system && data.system.status && data.system.data && data.system.data.length > 0) {
        const systemData = data.system.data[0];
        
        // Update uptime
        if (systemData.uptime) {
            const uptimeElement = document.getElementById('system-uptime');
            if (uptimeElement) {
                uptimeElement.textContent = formatUptime(systemData.uptime);
                
                // Calculate uptime percentage (assume 30 days as 100%)
                const maxUptimeSeconds = 30 * 24 * 60 * 60; // 30 days in seconds
                const percentage = Math.min(100, (systemData.uptime / maxUptimeSeconds) * 100);
                
                // Update progress bar
                const uptimeProgressBar = document.querySelector('.uptime-progress-bar');
                if (uptimeProgressBar) {
                    uptimeProgressBar.style.width = `${percentage}%`;
                    uptimeProgressBar.setAttribute('aria-valuenow', percentage);
                }
            }
        }
        
        // Update memory usage
        if (systemData.memory) {
            const memoryUsageElement = document.getElementById('memory-usage');
            if (memoryUsageElement) {
                const totalMemory = systemData.memory.total;
                const freeMemory = systemData.memory.free;
                const usedMemory = totalMemory - freeMemory;
                const usedPercentage = (usedMemory / totalMemory * 100).toFixed(1);
                
                memoryUsageElement.textContent = `${usedPercentage}%`;
                
                // Update progress bar if exists
                const memoryProgressBar = document.querySelector('.memory-progress-bar');
                if (memoryProgressBar) {
                    memoryProgressBar.style.width = `${usedPercentage}%`;
                    memoryProgressBar.setAttribute('aria-valuenow', usedPercentage);
                }
            }
        }
    }
    
    // Update CPU usage from luci endpoint (more accurate)
    if (data.luci && data.luci.status && data.luci.data && data.luci.data.length > 0) {
        const luciData = data.luci.data[0];
        if (luciData.cpuusage) {
            const cpuUsageElement = document.getElementById('cpu-usage');
            if (cpuUsageElement) {
                // Get CPU usage directly from luci endpoint
                const cpuPercentage = luciData.cpuusage.replace('%', '');
                
                cpuUsageElement.textContent = `${cpuPercentage}%`;
                
                // Update progress bar if exists
                const cpuProgressBar = document.querySelector('.cpu-progress-bar');
                if (cpuProgressBar) {
                    cpuProgressBar.style.width = `${cpuPercentage}%`;
                    cpuProgressBar.setAttribute('aria-valuenow', cpuPercentage);
                }
            }
        }
    } else {
        // Fallback to load average if luci data is not available
        if (data.system && data.system.status && data.system.data && data.system.data.length > 0) {
            const systemData = data.system.data[0];
            if (systemData.load) {
                const cpuUsageElement = document.getElementById('cpu-usage');
                if (cpuUsageElement) {
                    // Estimate CPU usage from load average (1 minute)
                    const loadAvg = systemData.load[0] / 100; // Load value divided by 100 to get percentage
                    const cpuPercentage = Math.min(100, loadAvg).toFixed(1);
                    
                    cpuUsageElement.textContent = `${cpuPercentage}%`;
                    
                    // Update progress bar if exists
                    const cpuProgressBar = document.querySelector('.cpu-progress-bar');
                    if (cpuProgressBar) {
                        cpuProgressBar.style.width = `${cpuPercentage}%`;
                        cpuProgressBar.setAttribute('aria-valuenow', cpuPercentage);
                    }
                }
            }
        }
    }
}

// Function to format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B/s';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i] + '/s';
}

// Function to update network traffic data
function updateNetworkData(data) {
    if (data.network && data.network.status && data.network.data && data.network.data.length > 0) {
        // Get the first interface with statistics for initial display
        const networkData = data.network.data[0];
        let interfaceWithStats = null;
        
        // Find the first interface with statistics
        for (const [ifaceName, ifaceData] of Object.entries(networkData)) {
            if (ifaceData.statistics && ifaceData.up) {
                interfaceWithStats = { name: ifaceName, data: ifaceData };
                break;
            }
        }
        
        if (interfaceWithStats) {
            // Store interface data globally for traffic calculations
            if (!window.interfaceData) {
                window.interfaceData = {};
            }
            
            const ifaceName = interfaceWithStats.name;
            const ifaceData = interfaceWithStats.data;
            const stats = ifaceData.statistics;
            
            // Update download and upload speed
            const downloadSpeedText = document.getElementById('downloadSpeedText');
            const uploadSpeedText = document.getElementById('uploadSpeedText');
            
            if (stats) {
                const rxBytes = stats.rx_bytes || 0;
                const txBytes = stats.tx_bytes || 0;
                
                // Calculate speeds if we have previous data
                if (window.interfaceData[ifaceName]) {
                    const prevData = window.interfaceData[ifaceName];
                    const timeDiff = (Date.now() - prevData.timestamp) / 1000; // in seconds
                    
                    if (timeDiff > 0) {
                        const downloadSpeed = (rxBytes - prevData.rxBytes) / timeDiff;
                        const uploadSpeed = (txBytes - prevData.txBytes) / timeDiff;
                        
                        if (downloadSpeedText) {
                            downloadSpeedText.textContent = formatBytes(downloadSpeed);
                        }
                        
                        if (uploadSpeedText) {
                            uploadSpeedText.textContent = formatBytes(uploadSpeed);
                        }
                        
                        // Update chart if we have one
                        if (window.updateChartData && typeof window.updateChartData === 'function') {
                            window.updateChartData(downloadSpeed, uploadSpeed);
                        }
                    }
                }
                
                // Store current data for next calculation
                window.interfaceData[ifaceName] = {
                    rxBytes: rxBytes,
                    txBytes: txBytes,
                    timestamp: Date.now()
                };
            }
        }
        
        // Update interface selector if needed
        updateInterfaceSelector(networkData);
    }
}

// Function to update interface selector
function updateInterfaceSelector(networkData) {
    const interfaceSelector = document.getElementById('interfaceSelector');
    if (!interfaceSelector) return;
    
    // Check if we need to update the selector (only on first load or if interfaces change)
    if (!window.interfacesLoaded) {
        let html = '';
        let firstActive = true;
        
        // Create tabs for each interface
        for (const [ifaceName, ifaceData] of Object.entries(networkData)) {
            // Skip loopback interface (lo)
            if (ifaceName === 'lo') continue;
            
            if (ifaceData.type) {
                const type = ifaceData.type;
                
                // Check if interface is up based on carrier status for more accuracy
                // Some interfaces may report up:true but have no carrier
                const isUp = ifaceData.up && ifaceData.carrier ? true : false;
                
                const statusIcon = isUp ? 
                    '<i class="fas fa-check-circle text-success"></i>' : 
                    '<i class="fas fa-times-circle text-danger"></i>';
                
                html += `
                <li class="nav-item">
                    <button class="nav-link ${firstActive ? 'active' : ''}" 
                            data-bs-toggle="tab" 
                            data-interface="${ifaceName}"
                            type="button">
                        ${ifaceName} <small class="text-muted">(${type})</small> ${statusIcon}
                    </button>
                </li>`;
                
                if (firstActive) {
                    // Set the first interface as active
                    window.activeInterface = ifaceName;
                    firstActive = false;
                }
            }
        }
        
        // Update the interface selector if we have interfaces
        if (html) {
            interfaceSelector.innerHTML = html;
            
            // Add event listeners to the new tabs
            document.querySelectorAll('#interfaceSelector .nav-link').forEach(tab => {
                tab.addEventListener('click', function() {
                    // Remove active class from all tabs
                    document.querySelectorAll('#interfaceSelector .nav-link').forEach(t => {
                        t.classList.remove('active');
                    });
                    
                    // Add active class to clicked tab
                    this.classList.add('active');
                    
                    // Update active interface
                    window.activeInterface = this.getAttribute('data-interface');
                    
                    // Update interface details
                    updateInterfaceDetails(window.activeInterface);
                    
                    // Update VNStat data for the selected interface
                    updateVnstatData('days', window.activeInterface);
                    updateVnstatData('months', window.activeInterface);
                    updateVnstatData('hours', window.activeInterface);
                    updateVnstatData('fiveminutes', window.activeInterface);
                });
            });
            
            // Mark interfaces as loaded
            window.interfacesLoaded = true;
            
            // Update details for the active interface
            if (window.activeInterface) {
                updateInterfaceDetails(window.activeInterface);
            }
        }
    }
}

// Function to update interface details
function updateInterfaceDetails(interfaceName) {
    // Fetch specific interface data
    fetch(`api.php?network=${interfaceName}`)
        .then(response => response.json())
        .then(data => {
            if (data.network && data.network.status) {
                const detailsList = document.getElementById('interfaceDetailsList');
                if (!detailsList) return;
                
                // Get interface data from the device endpoint if specific interface data is not available
                let interfaceData = {};
                if (data.network.data && data.network.data.length > 0) {
                    // Specific interface data available
                    interfaceData = data.network.data[0];
                } else if (window.lastNetworkData && window.lastNetworkData[interfaceName]) {
                    // Use data from the device endpoint
                    interfaceData = window.lastNetworkData[interfaceName];
                } else {
                    // No data available
                    detailsList.innerHTML = '<tr><td colspan="4" class="text-center">No data available for this interface</td></tr>';
                    return;
                }
                
                // Get status indicators
                // Interface is considered truly UP only if it has both up=true and carrier=true
                const isUp = interfaceData.up && interfaceData.carrier ? true : false;
                const hasCarrier = interfaceData.carrier ? true : false;
                const mtu = interfaceData.mtu || 'N/A';
                const macaddr = interfaceData.macaddr || 'N/A';
                const protocol = interfaceData.protocol || 'unknown';
                
                // Get uptime if available
                const uptime = interfaceData.uptime ? formatUptime(interfaceData.uptime) : '0d 0h 0m';
                
                // Get traffic stats
                let rxBytes = 0;
                let txBytes = 0;
                if (interfaceData.statistics) {
                    rxBytes = interfaceData.statistics.rx_bytes || 0;
                    txBytes = interfaceData.statistics.tx_bytes || 0;
                }
                
                // Format traffic stats to GB with 2 decimal places
                const rxGB = (rxBytes / (1024 * 1024 * 1024)).toFixed(2);
                const txGB = (txBytes / (1024 * 1024 * 1024)).toFixed(2);
                
                // Build HTML for interface details
                let html = `
                    <tr>
                        <td>
                            <div class="d-flex px-2 py-1">
                                <div class="d-flex flex-column justify-content-center">
                                    <h6 class="mb-0 text-sm">${interfaceName}</h6>
                                    <p class="text-xs text-secondary mb-0">Type: ${interfaceData.type || 'Unknown'}</p>
                                    <p class="text-xs text-secondary mb-0">Protocol: ${protocol}</p>
                                    <p class="text-xs text-secondary mb-0">Uptime: ${uptime}</p>
                                    <p class="text-xs text-secondary mb-0">MAC: ${macaddr}</p>
                                    <p class="text-xs text-secondary mb-0">MTU: ${mtu}</p>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="d-flex flex-column">
                                <h6 class="mb-1 text-sm">IPv4</h6>
                                <p class="text-xs font-weight-bold mb-0">${interfaceData.ipv4_address || 'No IPv4'}</p>
                                <h6 class="mb-1 text-sm mt-2">IPv6</h6>
                                <p class="text-xs font-weight-bold mb-0">${interfaceData.ipv6_address || 'No IPv6'}</p>
                            </div>
                        </td>
                        <td>
                            <h6 class="mb-1 text-sm">DNS Servers</h6>
                            <p class="text-xs font-weight-bold mb-0">${interfaceData.dns && interfaceData.dns.length > 0 ? interfaceData.dns[0] : 'No DNS servers'}</p>
                            <p class="text-xs text-secondary mb-0">${interfaceData.dns && interfaceData.dns.length > 1 ? interfaceData.dns[1] : ''}</p>
                            <h6 class="mb-1 text-sm mt-2">Metric</h6>
                            <p class="text-xs font-weight-bold mb-0">${interfaceData.metric || '0'}</p>
                            <p class="text-xs text-secondary mb-0">DNS Metric: ${interfaceData.dns_metric || '0'}</p>
                        </td>
                        <td class="align-middle">
                            <div class="d-flex flex-column">
                                <span class="badge badge-sm ${isUp ? 'bg-gradient-success' : 'bg-gradient-danger'} mb-1">
                                    ${isUp ? 'UP' : 'DOWN'}
                                </span>
                                <span class="badge badge-sm bg-gradient-info mb-1">
                                    ${hasCarrier ? 'CARRIER' : 'NO CARRIER'}
                                </span>
                                <span class="badge badge-sm bg-gradient-warning mb-1">
                                    AUTOSTART
                                </span>
                                <div class="mt-2">
                                    <p class="text-xs font-weight-bold mb-0">RX: ${rxGB} GB</p>
                                    <p class="text-xs font-weight-bold mb-0">TX: ${txGB} GB</p>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
                
                detailsList.innerHTML = html;
            }
        })
        .catch(error => {
            console.error('Error fetching interface details:', error);
        });
}

// Main function to fetch data from API
function updateData() {
    // Record update time
    window.lastUpdateTimestamp = Date.now();
    
    console.log('Fetching data from API...');
    // Fetch data from API with system info, CPU usage, and online users
    fetch(`api.php?network=device&system=info&luci=getCPUUsage&users=online`)
        .then(response => {
            console.log('API response status:', response.status);
            return response.text();
        })
        .then(text => {
            console.log('Raw API response:', text);
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
                console.error('Invalid JSON:', text);
                throw new Error('Invalid JSON response');
            }
        })
        .then(data => {
            console.log('Data from API:', data);
            
            // Store network data for interface details
            if (data.network && data.network.status && data.network.data && data.network.data.length > 0) {
                window.lastNetworkData = data.network.data[0];
                console.log('Network data stored:', window.lastNetworkData);
            } else {
                console.warn('No valid network data found in response');
            }
            
            // Update system information
            updateSystemInfo(data);
            
            // Update online users count
            updateOnlineUsers(data);
            
            // Update network data
            updateNetworkData(data);
            
            // Update memory information
            updateMemoryInfo(data);
            
            // Check if we have root storage information in system data
            if (data.system && data.system.status && data.system.data && data.system.data.length > 0) {
                const systemData = data.system.data[0];
                console.log('System data:', systemData);
                if (systemData.root) {
                    // Update storage information directly from system data
                    updateStorageFromSystemData(systemData.root);
                }
            } else {
                console.warn('No valid system data found in response');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

// Initialize traffic chart
function initTrafficChart() {
    const ctx = document.getElementById('trafficChart');
    if (!ctx) return null;
    
    // Create gradient for download
    const downloadGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    downloadGradient.addColorStop(0, 'rgba(66, 135, 245, 0.8)');
    downloadGradient.addColorStop(1, 'rgba(66, 135, 245, 0.2)');
    
    // Create gradient for upload
    const uploadGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    uploadGradient.addColorStop(0, 'rgba(45, 206, 137, 0.8)');
    uploadGradient.addColorStop(1, 'rgba(45, 206, 137, 0.2)');
    
    // Initialize empty data
    const labels = [];
    const downloadData = [];
    const uploadData = [];
    
    // Create 30 empty data points (for 90 seconds of data with 3-second intervals)
    for (let i = 0; i < 30; i++) {
        labels.push('');
        downloadData.push(0);
        uploadData.push(0);
    }
    
    // Create chart
    const trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Download',
                    data: downloadData,
                    borderColor: '#4287f5',
                    backgroundColor: downloadGradient,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Upload',
                    data: uploadData,
                    borderColor: '#2dce89',
                    backgroundColor: uploadGradient,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            family: 'Open Sans'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatBytes(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        borderDash: [5, 5],
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return formatBytes(value).replace('/s', '');
                        },
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
    
    return trafficChart;
}

// Function to update chart data
function updateChartData(downloadSpeed, uploadSpeed) {
    if (!window.trafficChart) return;
    
    // Add new data points
    window.trafficChart.data.datasets[0].data.push(downloadSpeed);
    window.trafficChart.data.datasets[1].data.push(uploadSpeed);
    
    // Remove oldest data points to maintain 30 data points
    if (window.trafficChart.data.datasets[0].data.length > 30) {
        window.trafficChart.data.datasets[0].data.shift();
        window.trafficChart.data.datasets[1].data.shift();
    }
    
    // Update chart
    window.trafficChart.update();
}

// Add refresh interface button handler
function setupRefreshButton() {
    const refreshButton = document.getElementById('refreshInterfaceBtn');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            // Reset interfaces loaded flag to force refresh
            window.interfacesLoaded = false;
            
            // Update data immediately
            updateData();
            
            // Show loading indicator on button
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Refreshing...';
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                this.innerHTML = 'Refresh';
            }, 2000);
        });
    }
}

// Function to update network status information
function updateNetworkStatus() {
    // Fetch connection status
    fetch(`api.php?connection=status`)
        .then(response => response.json())
        .then(data => {
            if (data.connection && data.connection.status && data.connection.data && data.connection.data.length > 0) {
                const connectionData = data.connection.data[0];
                
                // Update connection status
                const connectionStatusElement = document.getElementById('connection-status');
                if (connectionStatusElement) {
                    connectionStatusElement.textContent = connectionData.status;
                    
                    // Update class based on status
                    if (connectionData.status === 'Connected') {
                        connectionStatusElement.classList.remove('text-danger');
                        connectionStatusElement.classList.add('text-success');
                    } else {
                        connectionStatusElement.classList.remove('text-success');
                        connectionStatusElement.classList.add('text-danger');
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error fetching connection status:', error);
        });
    
    // Fetch public IP information
    fetch(`api.php?publicip=info`)
        .then(response => response.json())
        .then(data => {
            if (data.publicip && data.publicip.status && data.publicip.data && data.publicip.data.length > 0) {
                const publicIPData = data.publicip.data[0];
                
                // Update public IP
                const publicIPElement = document.getElementById('public-ip');
                if (publicIPElement) {
                    publicIPElement.textContent = publicIPData.ip;
                }
                
                // Update ISP information
                const publicISPElement = document.getElementById('public-isp');
                if (publicISPElement) {
                    publicISPElement.textContent = publicIPData.isp;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching public IP:', error);
        });
    
    // Fetch ping time
    fetch(`api.php?ping=time&host=google.com`)
        .then(response => response.json())
        .then(data => {
            if (data.ping && data.ping.status && data.ping.data && data.ping.data.length > 0) {
                const pingData = data.ping.data[0];
                
                // Update ping time
                const pingTimeElement = document.getElementById('ping-time');
                if (pingTimeElement) {
                    pingTimeElement.textContent = pingData.time;
                    
                    // Update class based on ping value
                    if (pingData.time === 'Timeout') {
                        pingTimeElement.classList.remove('text-success', 'text-warning');
                        pingTimeElement.classList.add('text-danger');
                    } else {
                        // Extract numeric value from ping time string
                        const pingMatch = pingData.time.match(/([\d.]+)/);
                        if (pingMatch) {
                            const pingValue = parseFloat(pingMatch[1]);
                            
                            // Remove all classes first
                            pingTimeElement.classList.remove('text-success', 'text-warning', 'text-danger');
                            
                            // Add appropriate class based on ping value
                            if (pingValue > 200) {
                                pingTimeElement.classList.add('text-danger');
                            } else if (pingValue > 100) {
                                pingTimeElement.classList.add('text-warning');
                            } else {
                                pingTimeElement.classList.add('text-success');
                            }
                        }
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error fetching ping time:', error);
        });
    
    // Update last update time
    const lastUpdateTimeElement = document.getElementById('last-update-time');
    if (lastUpdateTimeElement) {
        const now = new Date();
        lastUpdateTimeElement.textContent = now.toLocaleTimeString();
    }
}

// Function to update memory information
function updateMemoryInfo(data) {
    if (data.system && data.system.status && data.system.data && data.system.data.length > 0) {
        const systemData = data.system.data[0];
        
        if (systemData.memory) {
            const memory = systemData.memory;
            const total = memory.total;
            const free = memory.free;
            const cached = memory.cached || 0;
            const buffered = memory.buffered || 0;
            
            // Calculate used memory (excluding cache and buffers)
            const used = total - free - cached - buffered;
            const usedPercentage = (used / total * 100).toFixed(1);
            
            // Format memory values
            const formatMemory = (bytes) => {
                if (bytes < 1024 * 1024) {
                    return (bytes / 1024).toFixed(1) + ' KB';
                } else if (bytes < 1024 * 1024 * 1024) {
                    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
                } else {
                    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
                }
            };
            
            // Update memory usage value
            const memoryValueElement = document.getElementById('memory-value');
            if (memoryValueElement) {
                memoryValueElement.textContent = usedPercentage + '%';
            }
            
            // Update memory progress bar
            const memoryProgressElement = document.getElementById('memory-progress');
            if (memoryProgressElement) {
                memoryProgressElement.style.width = usedPercentage + '%';
                memoryProgressElement.setAttribute('aria-valuenow', usedPercentage);
            }
            
            // Update memory details
            const memoryTotalElement = document.getElementById('memory-total');
            if (memoryTotalElement) {
                memoryTotalElement.textContent = formatMemory(total);
            }
            
            const memoryFreeElement = document.getElementById('memory-free');
            if (memoryFreeElement) {
                memoryFreeElement.textContent = formatMemory(free);
            }
            
            const memoryCachedElement = document.getElementById('memory-cached');
            if (memoryCachedElement) {
                memoryCachedElement.textContent = formatMemory(cached);
            }
            
            const memoryBufferedElement = document.getElementById('memory-buffered');
            if (memoryBufferedElement) {
                memoryBufferedElement.textContent = formatMemory(buffered);
            }
        }
    }
}

// Function to update tunnel services status
function updateTunnelServices() {
    // Fetch tunnel services status
    fetch(`api.php?luci=getTunnelStatus`)
        .then(response => response.json())
        .then(data => {
            if (data.luci && data.luci.status && data.luci.data && data.luci.data.length > 0) {
                const tunnelData = data.luci.data[0];
                updateTunnelServicesUI(tunnelData);
            }
        })
        .catch(error => {
            console.error('Error fetching tunnel services status:', error);
        });
}

// Function to update system resources
function updateSystemResources() {
    console.log('Updating system resources...');
    // Fetch CPU info and system board info
    fetch(`api.php?system=board&luci=getCPUInfo`)
        .then(response => response.json())
        .then(data => {
            console.log('System resources data:', data);
            // Get the container for system resources
            const container = document.querySelector('.system-progress-container');
            console.log('Container found:', container);
            if (!container) return;
            
            // Clear the container
            container.innerHTML = '';
            
            // Create table for system info with fixed width
            const table = document.createElement('table');
            table.className = 'table table-sm align-items-center mb-0';
            table.style.width = '100%';
            table.style.tableLayout = 'fixed';
            
            // Create table body
            const tbody = document.createElement('tbody');
            
            // Add system info rows
            if (data.system && data.system.status && data.system.data && data.system.data.length > 0) {
                const systemData = data.system.data[0];
                
                // Extract CPU info from system data
                const cpuInfo = systemData.system;
                
                // Extract speed and temperature from luci data
                let cpuSpeed = '';
                let cpuTemp = '';
                if (data.luci && data.luci.status && data.luci.data && data.luci.data.length > 0) {
                    const cpuData = data.luci.data[0];
                    if (cpuData.cpuinfo) {
                        const match = cpuData.cpuinfo.match(/(\d+)MHz,\s*(\d+\.\d+)°C/);
                        if (match) {
                            cpuSpeed = match[1];
                            cpuTemp = match[2];
                        }
                    }
                }
                
                // Array of system info to display
                const systemInfo = [
                    { label: 'CPU', value: cpuInfo },
                    { label: 'Speed', value: cpuSpeed ? cpuSpeed + 'MHz' : '' },
                    { 
                        label: 'Temperature', 
                        value: cpuTemp ? cpuTemp + '°C' : '',
                        isTemp: true,
                        temp: parseFloat(cpuTemp)
                    },
                    { label: 'Model', value: systemData.model },
                    { label: 'Board', value: systemData.board_name },
                    { label: 'System', value: systemData.system },
                    { label: 'Kernel', value: systemData.kernel },
                    { label: 'Storage', value: systemData.rootfs_type?.toUpperCase() },
                    { 
                        label: 'Version', 
                        value: `${systemData.release?.distribution || ''} ${systemData.release?.version || ''}`
                    },
                    { 
                        label: 'Build', 
                        value: systemData.release?.revision || ''
                    }
                ];
                
                // Create rows for each info
                systemInfo.forEach(info => {
                    if (info.value) {
                        const row = document.createElement('tr');
                        
                        const labelCell = document.createElement('td');
                        labelCell.className = 'text-xs';
                        labelCell.style.width = '30%';
                        labelCell.style.padding = '4px 8px';
                        labelCell.style.textAlign = 'left';
                        labelCell.textContent = info.label + ':';
                        
                        const valueCell = document.createElement('td');
                        valueCell.className = 'text-xs font-weight-bold text-end';
                        valueCell.style.width = '70%';
                        valueCell.style.padding = '4px 8px';
                        valueCell.style.whiteSpace = 'nowrap';
                        valueCell.style.overflow = 'hidden';
                        valueCell.style.textOverflow = 'ellipsis';
                        valueCell.title = info.value;
                        valueCell.textContent = info.value;
                        
                        // Add color for temperature
                        if (info.isTemp && !isNaN(info.temp)) {
                            if (info.temp > 70) {
                                valueCell.classList.add('text-danger');
                            } else if (info.temp > 60) {
                                valueCell.classList.add('text-warning');
                            } else {
                                valueCell.classList.add('text-success');
                            }
                        }
                        
                        row.appendChild(labelCell);
                        row.appendChild(valueCell);
                        tbody.appendChild(row);
                    }
                });
            }
            

            
            // Append tbody to table
            table.appendChild(tbody);
            
            // Append table to container
            container.appendChild(table);
        })
        .catch(error => {
            console.error('Error fetching system resources:', error);
        });
}

// Function to update tunnel services UI
function updateTunnelServicesUI(tunnelData) {
    // Get the container for tunnel services - gunakan class process-status-container yang benar
    const tunnelServicesContainer = document.querySelector('.process-status-container');
    if (!tunnelServicesContainer) {
        return;
    }
    
    // Clear the container
    tunnelServicesContainer.innerHTML = '';
    
    // Define the services we want to display
    const services = [
        { id: 'xray', name: 'XRAY' },
        { id: 'mihomo', name: 'MIHOMO' },
        { id: 'sing-box', name: 'SING-BOX' },
        { id: 'tailscale', name: 'TAILSCALE' },
        { id: 'cloudflared', name: 'CLOUDFLARED' },
        { id: 'ngrok', name: 'NGROK' }
    ];
    
    // Buat satu row untuk semua services (lebih responsif)
    const row = document.createElement('div');
    row.className = 'row g-1'; // Spacing kecil
    tunnelServicesContainer.appendChild(row);
    
    services.forEach((service, index) => {
        // Get the status from the tunnel data
        const serviceStatus = tunnelData[service.id] || { running: false };
        
        // Create a column for this service
        const serviceCol = document.createElement('div');
        serviceCol.className = 'col-4 col-md-4 mb-1'; // Kurangi margin bottom
        
        // Create the service card dengan style yang sederhana
        const serviceCard = document.createElement('div');
        serviceCard.className = 'card'; 
        
        // Tambahkan warna background sesuai status
        if (serviceStatus.running) {
            serviceCard.style.backgroundColor = '#edfff5'; // Light green background
        } else {
            serviceCard.style.backgroundColor = '#fff5f5'; // Light red background
        }
        
        // Create the card body dengan padding minimal
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body p-1 text-center'; // Minimal padding
        
        // Buat nama service dengan text biasa (tanpa badge)
        const serviceName = document.createElement('div');
        serviceName.className = 'text-xs font-weight-bold'; // Text kecil dan bold
        serviceName.textContent = service.name;
        
        // Buat status text sederhana
        const statusText = document.createElement('div');
        const statusColor = serviceStatus.running ? 'text-success' : 'text-danger';
        const statusLabel = serviceStatus.running ? 'Running' : 'Not Run';
        
        // Buat text status sederhana
        statusText.className = 'text-xs ' + statusColor;
        statusText.textContent = statusLabel;
        
        // Assemble the card dengan urutan yang logis
        cardBody.appendChild(serviceName);
        cardBody.appendChild(statusText);
        serviceCard.appendChild(cardBody);
        serviceCol.appendChild(serviceCard);
        
        // Add to the row
        row.appendChild(serviceCol);
    });
}

// Fungsi updateStorageInfo sudah tidak digunakan lagi karena kita menggunakan updateStorageFromSystemData
// yang mengambil data langsung dari system info

// Function to update storage information from system data
function updateStorageFromSystemData(rootData) {
    if (!rootData) return;
    
    const total = parseInt(rootData.total) * 1024;
    const free = parseInt(rootData.free) * 1024;
    const used = total - free;
    const usedPercentage = (used / total * 100).toFixed(1);
    
    // Format storage values
    const formatStorage = (bytes) => {
        if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(1) + ' KB';
        } else if (bytes < 1024 * 1024 * 1024) {
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        } else {
            return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
        }
    };
    
    // Update storage usage value
    const storageValueElement = document.getElementById('storage-value');
    if (storageValueElement) {
        storageValueElement.textContent = usedPercentage + '%';
    }
    
    // Update storage progress bar
    const storageProgressElement = document.getElementById('storage-progress');
    if (storageProgressElement) {
        storageProgressElement.style.width = usedPercentage + '%';
        storageProgressElement.setAttribute('aria-valuenow', usedPercentage);
    }
    
    // Update storage details
    const storageTotalElement = document.getElementById('storage-total');
    if (storageTotalElement) {
        storageTotalElement.textContent = formatStorage(total);
    }
    
    const storageFreeElement = document.getElementById('storage-free');
    if (storageFreeElement) {
        storageFreeElement.textContent = formatStorage(free);
    }
    
    const storageUsedElement = document.getElementById('storage-used');
    if (storageUsedElement) {
        storageUsedElement.textContent = formatStorage(used);
    }
}

// Function to format bytes for VNStat data display
function formatVnstatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Function to update VNStat data
function updateVnstatData(period, interface) {
    if (!interface) {
        interface = 'eth0'; // Default interface if none specified
    }
    
    console.log(`Updating VNStat data for ${interface}, period: ${period}`);
    
    // Fetch VNStat data for the specified interface
    fetch(`api.php?vnstat=${interface}`)
        .then(response => response.json())
        .then(data => {
            if (data.vnstat && data.vnstat.status && data.vnstat.data && data.vnstat.data.length > 0) {
                const vnstatData = data.vnstat.data[0];
                console.log(`Received VNStat data for ${interface}:`, vnstatData);
                
                // Update all-time statistics
                if (vnstatData.total) {
                    const totalRx = vnstatData.total.rx;
                    const totalTx = vnstatData.total.tx;
                    const totalTraffic = totalRx + totalTx;
                    
                    // Update download value
                    const rxElement = document.getElementById('vnstat-rx');
                    if (rxElement) {
                        rxElement.textContent = formatVnstatBytes(totalRx);
                    }
                    
                    // Update upload value
                    const txElement = document.getElementById('vnstat-tx');
                    if (txElement) {
                        txElement.textContent = formatVnstatBytes(totalTx);
                    }
                    
                    // Update total usage value
                    const totalElement = document.getElementById('vnstat-total');
                    if (totalElement) {
                        totalElement.textContent = formatVnstatBytes(totalTraffic);
                    }
                    
                    // Update since value
                    const sinceElement = document.getElementById('vnstat-since-value');
                    if (sinceElement) {
                        // Use the current date as placeholder
                        const now = new Date();
                        sinceElement.textContent = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                    }
                }
                
                // Update specific period data
                if (period === 'days' || period === 'weeks' || period === 'months') {
                    updateVnstatPeriodData(vnstatData, period);
                } else if (period === 'top') {
                    updateVnstatTopData(vnstatData);
                } else if (period === 'hours' || period === 'fiveminutes') {
                    updateVnstatPeriodData(vnstatData, period);
                }
            } else {
                console.warn(`No valid VNStat data for ${interface}`);
            }
        })
        .catch(error => {
            console.error('Error fetching VNStat data:', error);
        });
}

// Function to update top traffic days
function updateVnstatTopData(vnstatData) {
    if (vnstatData.top && Array.isArray(vnstatData.top)) {
        const tableBody = document.getElementById('vnstat-top-table');
        if (!tableBody) {
            console.warn('Table element vnstat-top-table not found');
            return;
        }
        
        // Clear existing table data
        tableBody.innerHTML = '';
        
        // Add rows for top days (limit to top 10)
        const topData = vnstatData.top.slice(0, 10);
        topData.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // Create index cell with Argon styling
            const indexCell = document.createElement('td');
            const indexWrapper = document.createElement('div');
            indexWrapper.className = 'd-flex px-2 py-1';
            
            const indexInner = document.createElement('div');
            indexInner.className = 'd-flex flex-column justify-content-center';
            
            const indexText = document.createElement('h6');
            indexText.className = 'mb-0 text-sm';
            indexText.textContent = (index + 1);
            
            indexInner.appendChild(indexText);
            indexWrapper.appendChild(indexInner);
            indexCell.appendChild(indexWrapper);
            row.appendChild(indexCell);
            
            // Format date
            const dateStr = `${entry.date.year}-${entry.date.month.toString().padStart(2, '0')}-${entry.date.day.toString().padStart(2, '0')}`;
            
            // Create date cell with Argon styling
            const dateCell = document.createElement('td');
            const dateWrapper = document.createElement('div');
            dateWrapper.className = 'd-flex px-2 py-1';
            
            const dateInner = document.createElement('div');
            dateInner.className = 'd-flex flex-column justify-content-center';
            
            const dateText = document.createElement('h6');
            dateText.className = 'mb-0 text-sm';
            dateText.textContent = dateStr;
            
            dateInner.appendChild(dateText);
            dateWrapper.appendChild(dateInner);
            dateCell.appendChild(dateWrapper);
            row.appendChild(dateCell);
            
            // Calculate total traffic
            const totalTraffic = entry.rx + entry.tx;
            
            // Create total cell with Argon styling
            const totalCell = document.createElement('td');
            const totalText = document.createElement('p');
            totalText.className = 'text-sm font-weight-bold mb-0';
            totalText.textContent = formatVnstatBytes(totalTraffic);
            totalCell.appendChild(totalText);
            row.appendChild(totalCell);
            
            // Create rate cell (download/upload percentages) with Argon styling
            const rateCell = document.createElement('td');
            const rateText = document.createElement('p');
            rateText.className = 'text-sm font-weight-bold mb-0';
            
            // Calculate download/upload percentages
            const rxPercentage = entry.rx > 0 ? Math.round((entry.rx / totalTraffic) * 100) : 0;
            const txPercentage = entry.tx > 0 ? Math.round((entry.tx / totalTraffic) * 100) : 0;
            rateText.textContent = `↓${rxPercentage}% ↑${txPercentage}%`;
            
            rateCell.appendChild(rateText);
            row.appendChild(rateCell);
            
            // Add row to table
            tableBody.appendChild(row);
            
            // Log for debugging
            console.log(`Added top data row:`, dateStr, formatVnstatBytes(totalTraffic));
        });
    } else {
        console.warn('No top data available in VNStat data');
    }
    
    // Update all-time statistics
    if (vnstatData.total) {
        const totalRx = vnstatData.total.rx;
        const totalTx = vnstatData.total.tx;
        const totalTraffic = totalRx + totalTx;
        
        // Update download value
        const rxElement = document.getElementById('vnstat-rx');
        if (rxElement) {
            rxElement.textContent = formatVnstatBytes(totalRx);
        }
        
        // Update upload value
        const txElement = document.getElementById('vnstat-tx');
        if (txElement) {
            txElement.textContent = formatVnstatBytes(totalTx);
        }
        
        // Update total usage value
        const totalElement = document.getElementById('vnstat-total');
        if (totalElement) {
            totalElement.textContent = formatVnstatBytes(totalTraffic);
        }
        
        // Update since value (use current date as placeholder or from vnstat data if available)
        const sinceElement = document.getElementById('vnstat-since-value');
        if (sinceElement) {
            if (vnstatData.created && vnstatData.created.date) {
                const createdDate = vnstatData.created.date;
                sinceElement.textContent = `${createdDate.year}-${createdDate.month.toString().padStart(2, '0')}`;
            } else {
                const now = new Date();
                sinceElement.textContent = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            }
        }
    } else {
        console.warn('No total data available in VNStat data');
    }
}

// Function to update VNStat period data (days, months, etc.)
function updateVnstatPeriodData(vnstatData, period) {
    // Map the period parameter to the corresponding property in vnstatData
    const periodMap = {
        'days': 'day',
        'hours': 'hour',
        'months': 'month',
        'years': 'year',
        'top': 'top',
        'fiveminutes': 'fiveminute',
        'weeks': 'day' // Weeks uses day data but filtered
    };
    
    const dataKey = periodMap[period] || 'day'; // Default to day if period is not recognized
    
    if (vnstatData[dataKey] && Array.isArray(vnstatData[dataKey])) {
        let periodData = vnstatData[dataKey];
        
        // Sort by date (newest first for most views)
        periodData = periodData.sort((a, b) => {
            const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
            const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
            return dateB - dateA;
        });
        
        // For weeks, filter to show only the last 4 weeks (or whatever is available)
        if (period === 'weeks') {
            // Group by week
            const weeklyData = [];
            let currentWeek = null;
            let weekTotal = { rx: 0, tx: 0 };
            let weekStart = null;
            
            periodData.forEach(entry => {
                const entryDate = new Date(entry.date.year, entry.date.month - 1, entry.date.day);
                const weekNumber = getWeekNumber(entryDate);
                
                if (currentWeek === null) {
                    // First entry
                    currentWeek = weekNumber;
                    weekStart = entryDate;
                    weekTotal = { rx: entry.rx, tx: entry.tx };
                } else if (weekNumber === currentWeek) {
                    // Same week, add to total
                    weekTotal.rx += entry.rx;
                    weekTotal.tx += entry.tx;
                } else {
                    // New week found, add the previous week to the weekly data
                    weeklyData.push({
                        date: {
                            year: weekStart.getFullYear(),
                            month: weekStart.getMonth() + 1,
                            day: weekStart.getDate()
                        },
                        rx: weekTotal.rx,
                        tx: weekTotal.tx,
                        weekNumber: currentWeek
                    });
                    
                    // Start new week
                    currentWeek = weekNumber;
                    weekStart = entryDate;
                    weekTotal = { rx: entry.rx, tx: entry.tx };
                }
            });
            
            // Add the last week
            if (currentWeek !== null) {
                weeklyData.push({
                    date: {
                        year: weekStart.getFullYear(),
                        month: weekStart.getMonth() + 1,
                        day: weekStart.getDate()
                    },
                    rx: weekTotal.rx,
                    tx: weekTotal.tx,
                    weekNumber: currentWeek
                });
            }
            
            // Use only the last 4 weeks
            periodData = weeklyData.slice(0, 4);
        } else if (period === 'days') {
            // Limit to last 3 days for daily view
            periodData = periodData.slice(0, 3);
        } else if (period === 'months') {
            // Limit to last 12 months for monthly view
            periodData = periodData.slice(0, 12);
        }
        
        const tableId = `vnstat-${period}-table`;
        const tableBody = document.getElementById(tableId);
        
        if (tableBody) {
            // Clear existing table data
            tableBody.innerHTML = '';
            
            // Add rows for each period entry
            periodData.forEach(entry => {
                const row = document.createElement('tr');
                
                // Format date based on period type
                let dateStr = '';
                if (dataKey === 'day') {
                    dateStr = `${entry.date.year}-${entry.date.month.toString().padStart(2, '0')}-${entry.date.day.toString().padStart(2, '0')}`;
                } else if (dataKey === 'month') {
                    dateStr = `${entry.date.year}-${entry.date.month.toString().padStart(2, '0')}`;
                } else if (dataKey === 'year') {
                    dateStr = `${entry.date.year}`;
                } else if (dataKey === 'hour') {
                    dateStr = `${entry.date.year}-${entry.date.month.toString().padStart(2, '0')}-${entry.date.day.toString().padStart(2, '0')} ${entry.time.hour.toString().padStart(2, '0')}:00`;
                } else if (dataKey === 'fiveminute') {
                    dateStr = `${entry.date.year}-${entry.date.month.toString().padStart(2, '0')}-${entry.date.day.toString().padStart(2, '0')} ${entry.time.hour.toString().padStart(2, '0')}:${entry.time.minute.toString().padStart(2, '0')}`;
                }
                
                // For weeks, add week number
                if (period === 'weeks' && entry.weekNumber) {
                    dateStr = `Week ${entry.weekNumber} (${dateStr})`;
                }
                
                // Create date cell using the Argon Dashboard structure
                const dateCell = document.createElement('td');
                const dateCellDiv = document.createElement('div');
                dateCellDiv.className = 'd-flex px-2 py-1';

                const dateCellInnerDiv = document.createElement('div');
                dateCellInnerDiv.className = 'd-flex flex-column justify-content-center';

                const dateCellText = document.createElement('h6');
                dateCellText.className = 'mb-0 text-sm';
                dateCellText.textContent = dateStr;

                dateCellInnerDiv.appendChild(dateCellText);
                dateCellDiv.appendChild(dateCellInnerDiv);
                dateCell.appendChild(dateCellDiv);
                row.appendChild(dateCell);

                // Calculate total traffic
                const totalTraffic = entry.rx + entry.tx;

                // Create total cell using the Argon Dashboard structure
                const totalCell = document.createElement('td');
                const totalCellText = document.createElement('p');
                totalCellText.className = 'text-sm font-weight-bold mb-0';
                totalCellText.textContent = formatVnstatBytes(totalTraffic);
                totalCell.appendChild(totalCellText);
                row.appendChild(totalCell);

                // Create rate cell (download/upload percentages) using the Argon Dashboard structure
                const rateCell = document.createElement('td');
                const rateCellText = document.createElement('p');
                rateCellText.className = 'text-sm font-weight-bold mb-0';

                // Calculate rate based on period type
                let rateText = '';
                if (dataKey === 'day') {
                    // For daily data, show download/upload ratio with arrows
                    const rxPercentage = entry.rx > 0 ? Math.round((entry.rx / totalTraffic) * 100) : 0;
                    const txPercentage = entry.tx > 0 ? Math.round((entry.tx / totalTraffic) * 100) : 0;
                    rateText = `↓${rxPercentage}% ↑${txPercentage}%`;
                } else if (dataKey === 'month') {
                    // For monthly data, show daily average
                    const daysInMonth = new Date(entry.date.year, entry.date.month, 0).getDate();
                    const dailyAvg = totalTraffic / daysInMonth;
                    rateText = `${formatVnstatBytes(dailyAvg)}/day`;
                } else if (period === 'weeks') {
                    // For weekly data, show download/upload percentages
                    const rxPercentage = entry.rx > 0 ? Math.round((entry.rx / totalTraffic) * 100) : 0;
                    const txPercentage = entry.tx > 0 ? Math.round((entry.tx / totalTraffic) * 100) : 0;
                    rateText = `↓${rxPercentage}% ↑${txPercentage}%`;
                } else if (dataKey === 'hour' || dataKey === 'fiveminute') {
                    // For hourly or 5-minute data, show download/upload percentages
                    const rxPercentage = entry.rx > 0 ? Math.round((entry.rx / totalTraffic) * 100) : 0;
                    const txPercentage = entry.tx > 0 ? Math.round((entry.tx / totalTraffic) * 100) : 0;
                    rateText = `↓${rxPercentage}% ↑${txPercentage}%`;
                }

                rateCellText.textContent = rateText;
                rateCell.appendChild(rateCellText);
                row.appendChild(rateCell);

                // Add row to table
                tableBody.appendChild(row);

                // Log for debugging
                console.log(`Added row to ${tableId}:`, dateStr, formatVnstatBytes(totalTraffic), rateText);
            });
        }
    }
}



// Helper function to get week number
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Function to update running services list
function updateRunningServices() {
    console.log('Updating running services...');
    fetch('api.php?services=running')
        .then(response => response.json())
        .then(data => {
            if (data.services && data.services.status) {
                const servicesList = document.getElementById('services-list');
                const servicesCount = document.getElementById('services-count');
                const servicesCountDisplay = document.getElementById('services-count-display');
                const topServiceMemory = document.getElementById('top-service-memory');
                
                if (!servicesList) return;
                
                // Clear existing content
                servicesList.innerHTML = '';
                
                // Check if we have services data
                if (data.services.data && data.services.data.length > 0) {
                    // Update services count
                    const count = data.services.data.length;
                    if (servicesCount) servicesCount.textContent = count;
                    if (servicesCountDisplay) servicesCountDisplay.textContent = count;
                    
                    // Find top memory usage service
                    let topMemoryService = data.services.data[0];
                    for (let i = 1; i < data.services.data.length; i++) {
                        const currentMemory = data.services.data[i].memory;
                        // Convert memory to numeric value for comparison
                        const currentValue = parseFloat(currentMemory.replace(/[^0-9.]/g, ''));
                        const topValue = parseFloat(topMemoryService.memory.replace(/[^0-9.]/g, ''));
                        
                        // Adjust for MB vs KB
                        const currentIsMB = currentMemory.includes('MB');
                        const topIsMB = topMemoryService.memory.includes('MB');
                        
                        if (currentIsMB && !topIsMB) {
                            // Current is MB, top is KB, so current is larger
                            topMemoryService = data.services.data[i];
                        } else if (currentIsMB === topIsMB && currentValue > topValue) {
                            // Both are same unit and current value is larger
                            topMemoryService = data.services.data[i];
                        }
                    }
                    
                    // Update top memory usage display
                    if (topServiceMemory) {
                        topServiceMemory.textContent = `${topMemoryService.name} (${topMemoryService.memory})`;
                    }
                    
                    // Add rows for each service
                    data.services.data.forEach(service => {
                        const row = document.createElement('tr');
                        
                        // PID cell
                        const pidCell = document.createElement('td');
                        const pidText = document.createElement('p');
                        pidText.className = 'text-xs font-weight-bold mb-0';
                        pidText.textContent = service.pid;
                        pidCell.appendChild(pidText);
                        row.appendChild(pidCell);
                        
                        // Service name cell
                        const nameCell = document.createElement('td');
                        const nameDiv = document.createElement('div');
                        nameDiv.className = 'd-flex px-2 py-1';
                        
                        const nameInnerDiv = document.createElement('div');
                        nameInnerDiv.className = 'd-flex flex-column justify-content-center';
                        
                        const nameText = document.createElement('h6');
                        nameText.className = 'mb-0 text-sm';
                        nameText.textContent = service.name;
                        
                        const commandText = document.createElement('p');
                        commandText.className = 'text-xs text-secondary mb-0';
                        commandText.textContent = service.command.length > 30 ? 
                            service.command.substring(0, 30) + '...' : service.command;
                        commandText.title = service.command;
                        
                        nameInnerDiv.appendChild(nameText);
                        nameInnerDiv.appendChild(commandText);
                        nameDiv.appendChild(nameInnerDiv);
                        nameCell.appendChild(nameDiv);
                        row.appendChild(nameCell);
                        
                        // Memory usage cell
                        const memoryCell = document.createElement('td');
                        const memoryText = document.createElement('p');
                        memoryText.className = 'text-xs font-weight-bold mb-0';
                        memoryText.textContent = service.memory;
                        memoryCell.appendChild(memoryText);
                        row.appendChild(memoryCell);
                        
                        // Add row to table
                        servicesList.appendChild(row);
                    });
                } else {
                    // No services found
                    const row = document.createElement('tr');
                    const cell = document.createElement('td');
                    cell.colSpan = 3;
                    cell.className = 'text-center';
                    cell.textContent = 'No running services found';
                    row.appendChild(cell);
                    servicesList.appendChild(row);
                    
                    // Update counts to zero
                    if (servicesCount) servicesCount.textContent = '0';
                    if (servicesCountDisplay) servicesCountDisplay.textContent = '0';
                    if (topServiceMemory) topServiceMemory.textContent = '-';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching running services:', error);
        });
}

// Function to update system logs
function updateSystemLogs() {
    console.log('Updating system logs...');
    fetch('api.php?logs=system&lines=100')
        .then(response => response.json())
        .then(data => {
            if (data.logs && data.logs.status && data.logs.data && data.logs.data.length > 0) {
                const logsElement = document.getElementById('system-logs');
                if (logsElement) {
                    // Update logs content
                    logsElement.textContent = data.logs.data[0].content;
                    
                    // Scroll to bottom of logs container
                    const logContainer = logsElement.parentElement;
                    if (logContainer) {
                        logContainer.scrollTop = logContainer.scrollHeight;
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error fetching system logs:', error);
        });
}

// Setup refresh buttons for services and logs
function setupRefreshButtons() {
    // Services refresh button
    const refreshServicesBtn = document.getElementById('refreshServicesBtn');
    if (refreshServicesBtn) {
        refreshServicesBtn.addEventListener('click', function() {
            // Show loading indicator
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
            
            // Update services
            updateRunningServices();
            
            // Reset button after 1 second
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }, 1000);
        });
    }
    
    // Logs refresh button
    const refreshLogsBtn = document.getElementById('refreshLogsBtn');
    if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', function() {
            // Show loading indicator
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
            
            // Update logs
            updateSystemLogs();
            
            // Buka collapse jika tertutup
            const collapseSystemLogs = document.getElementById('collapseSystemLogs');
            if (collapseSystemLogs && !collapseSystemLogs.classList.contains('show')) {
                new bootstrap.Collapse(collapseSystemLogs).show();
                
                // Update tombol collapse
                const collapseToggle = document.querySelector('[data-bs-target="#collapseSystemLogs"]');
                if (collapseToggle) {
                    collapseToggle.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Log';
                }
            }
            
            // Reset button after 1 second
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }, 1000);
        });
    }
    
    // Setup collapse toggle untuk log
    const collapseLogToggle = document.querySelector('[data-bs-target="#collapseSystemLogs"]');
    if (collapseLogToggle) {
        // Set initial state
        const isCollapsed = !document.getElementById('collapseSystemLogs').classList.contains('show');
        if (!isCollapsed) {
            collapseLogToggle.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Log';
        } else {
            collapseLogToggle.innerHTML = '<i class="fas fa-chevron-down"></i> Show Log';
        }
        
        // Add event listener
        collapseLogToggle.addEventListener('click', function(e) {
            e.preventDefault();
            const isCollapsed = !document.getElementById('collapseSystemLogs').classList.contains('show');
            
            if (isCollapsed) {
                // Akan dibuka
                this.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Log';
            } else {
                // Akan ditutup
                this.innerHTML = '<i class="fas fa-chevron-down"></i> Show Log';
            }
        });
        
        // Trigger bootstrap collapse event handler
        document.getElementById('collapseSystemLogs').addEventListener('hidden.bs.collapse', function () {
            collapseLogToggle.innerHTML = '<i class="fas fa-chevron-down"></i> Show Log';
        });
        
        document.getElementById('collapseSystemLogs').addEventListener('shown.bs.collapse', function () {
            collapseLogToggle.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Log';
        });
    }
}

// Event listener when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize chart
    window.trafficChart = initTrafficChart();
    
    // Make updateChartData available globally
    window.updateChartData = updateChartData;
    
    // Setup refresh buttons
    setupRefreshButton();
    setupRefreshButtons();
    
    // Get initial data (termasuk storage info dari system data)
    updateData();
    
    // Update network status information, tunnel services, dan system resources
    updateNetworkStatus();
    updateTunnelServices();
    updateSystemResources();
    
    // Update running services and system logs
    updateRunningServices();
    updateSystemLogs();
    
    // Update VNStat data for default interface
    if (window.activeInterface) {
        updateVnstatData('days', window.activeInterface);
        updateVnstatData('weeks', window.activeInterface);
        updateVnstatData('months', window.activeInterface);
        updateVnstatData('top', window.activeInterface);
    } else {
        updateVnstatData('days', 'eth0');
        updateVnstatData('weeks', 'eth0');
        updateVnstatData('months', 'eth0');
        updateVnstatData('top', 'eth0');
    }
    
    // Update data every 3 seconds (termasuk storage info)
    setInterval(updateData, 3000);
    
    // Update network status, tunnel services, dan system resources (less frequent as these are slower operations)
    setInterval(updateNetworkStatus, 30000);
    setInterval(updateTunnelServices, 60000);
    setInterval(updateSystemResources, 10000); // Update system resources setiap 10 detik
    
    // Update VNStat data less frequently (every 5 minutes)
    setInterval(function() {
        if (window.activeInterface) {
            updateVnstatData('days', window.activeInterface);
            updateVnstatData('weeks', window.activeInterface);
            updateVnstatData('months', window.activeInterface);
            updateVnstatData('top', window.activeInterface);
        }
    }, 300000); // 5 minutes
});
function updateVnstatPeriodData(vnstatData, period) {
    // Map the period parameter to the corresponding property in vnstatData
    const periodMap = {
        'days': 'day',
        'hours': 'hour',
        'months': 'month',
        'years': 'year',
        'top': 'top',
        'fiveminute': 'fiveminute',
        'weeks': 'day' // Weeks uses day data but filtered
    };
    
    const dataKey = periodMap[period] || 'day'; // Default to day if period is not recognized
    
    if (vnstatData[dataKey] && Array.isArray(vnstatData[dataKey])) {
        let periodData = vnstatData[dataKey];
        
        // Sort by date (newest first for most views)
        periodData = periodData.sort((a, b) => {
            const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
            const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
            return dateB - dateA;
        });
        
        // For weeks, filter to show only the last 4 weeks (or whatever is available)
        if (period === 'weeks') {
            // Group by week
            const weeklyData = [];
            let currentWeek = null;
            let weekTotal = { rx: 0, tx: 0 };
            let weekStart = null;
            
            periodData.forEach(entry => {
                const entryDate = new Date(entry.date.year, entry.date.month - 1, entry.date.day);
                const weekNumber = getWeekNumber(entryDate);
                
                if (currentWeek === null) {
                    // First entry
                    currentWeek = weekNumber;
                    weekStart = entryDate;
                    weekTotal = { rx: entry.rx, tx: entry.tx };
                } else if (weekNumber === currentWeek) {
                    // Same week, add to total
                    weekTotal.rx += entry.rx;
                    weekTotal.tx += entry.tx;
                } else {
                    // New week found, add the previous week to the weekly data
                    weeklyData.push({
                        date: {
                            year: weekStart.getFullYear(),
                            month: weekStart.getMonth() + 1,
                            day: weekStart.getDate()
                        },
                        rx: weekTotal.rx,
                        tx: weekTotal.tx,
                        weekNumber: currentWeek
                    });
                    
                    // Start new week
                    currentWeek = weekNumber;
                    weekStart = entryDate;
                    weekTotal = { rx: entry.rx, tx: entry.tx };
                }
            });
            
            // Add the last week
            if (currentWeek !== null) {
                weeklyData.push({
                    date: {
                        year: weekStart.getFullYear(),
                        month: weekStart.getMonth() + 1,
                        day: weekStart.getDate()
                    },
                    rx: weekTotal.rx,
                    tx: weekTotal.tx,
                    weekNumber: currentWeek
                });
            }
            
            // Use only the last 4 weeks
            periodData = weeklyData.slice(0, 4);
        } else if (period === 'days') {
            // Limit to last 3 days for daily view
            periodData = periodData.slice(0, 3);
        } else if (period === 'months') {
            // Limit to last 12 months for monthly view
            periodData = periodData.slice(0, 12);
        }
        
        const tableId = `vnstat-${period}-table`;
        const tableBody = document.getElementById(tableId);
        
        if (tableBody) {
            // Clear existing table data
            tableBody.innerHTML = '';

            // Add rows for each period entry
            periodData.forEach(entry => {
                const row = document.createElement('tr');

                // Format date based on period type
                let dateStr = '';
                if (dataKey === 'day') {
                    dateStr = `${entry.date.year}-${entry.date.month.toString().padStart(2, '0')}-${entry.date.day.toString().padStart(2, '0')}`;
                } else if (dataKey === 'month') {
                    dateStr = `${entry.date.year}-${entry.date.month.toString().padStart(2, '0')}`;
                } else if (dataKey === 'year') {
                    dateStr = `${entry.date.year}`;
                } else if (dataKey === 'hour') {
                    dateStr = `${entry.date.year}-${entry.date.month.toString().padStart(2, '0')}-${entry.date.day.toString().padStart(2, '0')} ${entry.time.hour.toString().padStart(2, '0')}:00`;
                } else if (dataKey === 'fiveminute') {
                    dateStr = `${entry.date.year}-${entry.date.month.toString().padStart(2, '0')}-${entry.date.day.toString().padStart(2, '0')} ${entry.time.hour.toString().padStart(2, '0')}:${entry.time.minute.toString().padStart(2, '0')}`;
                }

                // For weeks, add week number
                if (period === 'weeks' && entry.weekNumber) {
                    dateStr = `Week ${entry.weekNumber} (${dateStr})`;
                }

                // Create date cell using the Argon Dashboard structure
                const dateCell = document.createElement('td');
                const dateCellDiv = document.createElement('div');
                dateCellDiv.className = 'd-flex px-2 py-1';

                const dateCellInnerDiv = document.createElement('div');
                dateCellInnerDiv.className = 'd-flex flex-column justify-content-center';

                const dateCellText = document.createElement('h6');
                dateCellText.className = 'mb-0 text-sm';
                dateCellText.textContent = dateStr;

                dateCellInnerDiv.appendChild(dateCellText);
                dateCellDiv.appendChild(dateCellInnerDiv);
                dateCell.appendChild(dateCellDiv);
                row.appendChild(dateCell);

                // Calculate total traffic
                const totalTraffic = entry.rx + entry.tx;

                // Create total cell using the Argon Dashboard structure
                const totalCell = document.createElement('td');
                const totalCellText = document.createElement('p');
                totalCellText.className = 'text-sm font-weight-bold mb-0';
                totalCellText.textContent = formatVnstatBytes(totalTraffic);
                totalCell.appendChild(totalCellText);
                row.appendChild(totalCell);

                // Create rate cell (download/upload percentages) using the Argon Dashboard structure
                const rateCell = document.createElement('td');
                const rateCellText = document.createElement('p');
                rateCellText.className = 'text-sm font-weight-bold mb-0';

                // Calculate rate based on period type
                let rateText = '';
                if (dataKey === 'day') {
                    // For daily data, show download/upload ratio with arrows
                    const rxPercentage = entry.rx > 0 ? Math.round((entry.rx / totalTraffic) * 100) : 0;
                    const txPercentage = entry.tx > 0 ? Math.round((entry.tx / totalTraffic) * 100) : 0;
                    rateText = `↓${rxPercentage}% ↑${txPercentage}%`;
                } else if (dataKey === 'month') {
                    // For monthly data, show daily average
                    const daysInMonth = new Date(entry.date.year, entry.date.month, 0).getDate();
                    const dailyAvg = totalTraffic / daysInMonth;
                    rateText = `${formatVnstatBytes(dailyAvg)}/day`;
                } else if (period === 'weeks') {
                    // For weekly data, show download/upload percentages
                    const rxPercentage = entry.rx > 0 ? Math.round((entry.rx / totalTraffic) * 100) : 0;
                    const txPercentage = entry.tx > 0 ? Math.round((entry.tx / totalTraffic) * 100) : 0;
                    rateText = `↓${rxPercentage}% ↑${txPercentage}%`;
                }

                rateCellText.textContent = rateText;
                rateCell.appendChild(rateCellText);
                row.appendChild(rateCell);

                // Add row to table
                tableBody.appendChild(row);

                // Log for debugging
                console.log(`Added row to ${tableId}:`, dateStr, formatVnstatBytes(totalTraffic), rateText);
            });
        }
    }
}
