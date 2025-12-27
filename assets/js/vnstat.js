// VnStat Data Handler for ResInfo
// This module handles fetching and displaying VnStat traffic data

/**
 * Format bytes to human-readable format for VnStat display
 * @param {number} bytes - The bytes to format
 * @param {number} decimals - Number of decimal places
 * @return {string} Formatted string
 */
function formatVnstatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Get week number from date
 * @param {Date} date - The date to get week number from
 * @return {number} Week number
 */
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Fetch VnStat data for the specified interface
 * @param {string} interfaceName - Network interface name (e.g., 'eth0')
 * @return {Promise} Promise resolving to VnStat data
 */
function fetchVnstatData(interfaceName) {
    return new Promise((resolve, reject) => {
        const apiUrl = `api.php?vnstat=${interfaceName}`;
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.vnstat && data.vnstat.status && data.vnstat.data && data.vnstat.data.length > 0) {
                    // API mengembalikan data dalam array, ambil elemen pertama
                    resolve(data.vnstat.data[0]);
                } else {
                    reject(new Error('Invalid VnStat data format'));
                }
            })
            .catch(error => {
                console.error('Error fetching VnStat data:', error);
                reject(error);
            });
    });
}

/**
 * Update all VnStat tables for the specified interface
 * @param {string} interfaceName - Network interface name (e.g., 'eth0')
 */
function updateAllVnstatTables(interfaceName) {
    if (!interfaceName) {
        console.error('No interface name provided for VnStat data');
        return;
    }
    
    // Show loading indicators
    document.querySelectorAll('#vnstat-days-table tbody, #vnstat-weeks-table tbody, #vnstat-months-table tbody, #vnstat-top10-table tbody')
        .forEach(tbody => {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">Loading...</td></tr>';
        });
    
    document.querySelectorAll('#vnstat-rx, #vnstat-tx, #vnstat-total, #vnstat-since-value')
        .forEach(element => {
            element.textContent = 'Loading...';
        });
    
    // Fetch VnStat data
    fetchVnstatData(interfaceName)
        .then(data => {
            // Update all tables with the fetched data
            updateDailyTable(data);
            updateWeeklyTable(data);
            updateMonthlyTable(data);
            updateTopTable(data);
            updateAlltimeStats(data);
        })
        .catch(error => {
            console.error('Failed to update VnStat tables:', error);
            // Show error message in tables
            document.querySelectorAll('#vnstat-days-table tbody, #vnstat-weeks-table tbody, #vnstat-months-table tbody, #vnstat-top10-table tbody')
                .forEach(tbody => {
                    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Failed to load data</td></tr>';
                });
            
            document.querySelectorAll('#vnstat-rx, #vnstat-tx, #vnstat-total, #vnstat-since-value')
                .forEach(element => {
                    element.textContent = 'N/A';
                });
        });
}

/**
 * Update the daily traffic table
 * @param {Object} data - VnStat data
 */
function updateDailyTable(data) {
    const tableBody = document.querySelector('#vnstat-days-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!data.day || data.day.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No daily data available</td></tr>';
        return;
    }
    
    // Sort days in descending order (newest first)
    const sortedDays = [...data.day].sort((a, b) => {
        const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
        const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
        return dateB - dateA;
    });
    
    // Take only the last 7 days
    const recentDays = sortedDays.slice(0, 7);
    
    recentDays.forEach(day => {
        const row = document.createElement('tr');
        
        // Date cell
        const dateCell = document.createElement('td');
        const dateCellDiv = document.createElement('div');
        dateCellDiv.className = 'd-flex px-2 py-1';
        
        const dateCellInnerDiv = document.createElement('div');
        dateCellInnerDiv.className = 'd-flex flex-column justify-content-center';
        
        const dateCellText = document.createElement('h6');
        dateCellText.className = 'mb-0 text-sm';
        
        const dateStr = `${day.date.year}-${day.date.month.toString().padStart(2, '0')}-${day.date.day.toString().padStart(2, '0')}`;
        dateCellText.textContent = dateStr;
        
        dateCellInnerDiv.appendChild(dateCellText);
        dateCellDiv.appendChild(dateCellInnerDiv);
        dateCell.appendChild(dateCellDiv);
        row.appendChild(dateCell);
        
        // Total traffic cell
        const totalTraffic = day.rx + day.tx;
        const totalCell = document.createElement('td');
        const totalCellText = document.createElement('p');
        totalCellText.className = 'text-sm font-weight-bold mb-0';
        totalCellText.textContent = formatVnstatBytes(totalTraffic);
        totalCell.appendChild(totalCellText);
        row.appendChild(totalCell);
        
        // Rate cell (download/upload percentages)
        const rateCell = document.createElement('td');
        const rateCellText = document.createElement('p');
        rateCellText.className = 'text-sm font-weight-bold mb-0';
        
        const rxPercentage = day.rx > 0 ? Math.round((day.rx / totalTraffic) * 100) : 0;
        const txPercentage = day.tx > 0 ? Math.round((day.tx / totalTraffic) * 100) : 0;
        rateCellText.textContent = `↓${rxPercentage}% ↑${txPercentage}%`;
        
        rateCell.appendChild(rateCellText);
        row.appendChild(rateCell);
        
        tableBody.appendChild(row);
    });
}

/**
 * Update the weekly traffic table
 * @param {Object} data - VnStat data
 */
function updateWeeklyTable(data) {
    const tableBody = document.querySelector('#vnstat-weeks-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!data.day || data.day.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No weekly data available</td></tr>';
        return;
    }
    
    // Group data by week
    const weeklyData = {};
    data.day.forEach(day => {
        const date = new Date(day.date.year, day.date.month - 1, day.date.day);
        const weekNumber = getWeekNumber(date);
        const weekYear = date.getFullYear();
        const weekKey = `${weekYear}-W${weekNumber}`;
        
        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
                year: weekYear,
                week: weekNumber,
                rx: 0,
                tx: 0,
                startDate: new Date(date)
            };
        }
        
        weeklyData[weekKey].rx += day.rx;
        weeklyData[weekKey].tx += day.tx;
        
        // Keep track of the earliest date in the week
        if (date < weeklyData[weekKey].startDate) {
            weeklyData[weekKey].startDate = new Date(date);
        }
    });
    
    // Convert to array and sort by week (newest first)
    const sortedWeeks = Object.values(weeklyData).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.week - a.week;
    });
    
    // Take only the last 4 weeks
    const recentWeeks = sortedWeeks.slice(0, 4);
    
    if (recentWeeks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No weekly data available</td></tr>';
        return;
    }
    
    recentWeeks.forEach(week => {
        const row = document.createElement('tr');
        
        // Period cell
        const periodCell = document.createElement('td');
        const periodCellDiv = document.createElement('div');
        periodCellDiv.className = 'd-flex px-2 py-1';
        
        const periodCellInnerDiv = document.createElement('div');
        periodCellInnerDiv.className = 'd-flex flex-column justify-content-center';
        
        const periodCellText = document.createElement('h6');
        periodCellText.className = 'mb-0 text-sm';
        
        const weekStart = week.startDate;
        const weekStartStr = `${weekStart.getFullYear()}-${(weekStart.getMonth() + 1).toString().padStart(2, '0')}-${weekStart.getDate().toString().padStart(2, '0')}`;
        periodCellText.textContent = `Week ${week.week} (${weekStartStr})`;
        
        periodCellInnerDiv.appendChild(periodCellText);
        periodCellDiv.appendChild(periodCellInnerDiv);
        periodCell.appendChild(periodCellDiv);
        row.appendChild(periodCell);
        
        // Total traffic cell
        const totalTraffic = week.rx + week.tx;
        const totalCell = document.createElement('td');
        const totalCellText = document.createElement('p');
        totalCellText.className = 'text-sm font-weight-bold mb-0';
        totalCellText.textContent = formatVnstatBytes(totalTraffic);
        totalCell.appendChild(totalCellText);
        row.appendChild(totalCell);
        
        // Rate cell (download/upload percentages)
        const rateCell = document.createElement('td');
        const rateCellText = document.createElement('p');
        rateCellText.className = 'text-sm font-weight-bold mb-0';
        
        const rxPercentage = week.rx > 0 ? Math.round((week.rx / totalTraffic) * 100) : 0;
        const txPercentage = week.tx > 0 ? Math.round((week.tx / totalTraffic) * 100) : 0;
        rateCellText.textContent = `↓${rxPercentage}% ↑${txPercentage}%`;
        
        rateCell.appendChild(rateCellText);
        row.appendChild(rateCell);
        
        tableBody.appendChild(row);
    });
}

/**
 * Update the monthly traffic table
 * @param {Object} data - VnStat data
 */
function updateMonthlyTable(data) {
    const tableBody = document.querySelector('#vnstat-months-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!data.month || data.month.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No monthly data available</td></tr>';
        return;
    }
    
    // Sort months in descending order (newest first)
    const sortedMonths = [...data.month].sort((a, b) => {
        if (a.date.year !== b.date.year) return b.date.year - a.date.year;
        return b.date.month - a.date.month;
    });
    
    // Take only the last 6 months
    const recentMonths = sortedMonths.slice(0, 6);
    
    recentMonths.forEach(month => {
        const row = document.createElement('tr');
        
        // Month cell
        const monthCell = document.createElement('td');
        const monthCellDiv = document.createElement('div');
        monthCellDiv.className = 'd-flex px-2 py-1';
        
        const monthCellInnerDiv = document.createElement('div');
        monthCellInnerDiv.className = 'd-flex flex-column justify-content-center';
        
        const monthCellText = document.createElement('h6');
        monthCellText.className = 'mb-0 text-sm';
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthCellText.textContent = `${monthNames[month.date.month - 1]} ${month.date.year}`;
        
        monthCellInnerDiv.appendChild(monthCellText);
        monthCellDiv.appendChild(monthCellInnerDiv);
        monthCell.appendChild(monthCellDiv);
        row.appendChild(monthCell);
        
        // Total traffic cell
        const totalTraffic = month.rx + month.tx;
        const totalCell = document.createElement('td');
        const totalCellText = document.createElement('p');
        totalCellText.className = 'text-sm font-weight-bold mb-0';
        totalCellText.textContent = formatVnstatBytes(totalTraffic);
        totalCell.appendChild(totalCellText);
        row.appendChild(totalCell);
        
        // Rate cell (daily average)
        const rateCell = document.createElement('td');
        const rateCellText = document.createElement('p');
        rateCellText.className = 'text-sm font-weight-bold mb-0';
        
        const daysInMonth = new Date(month.date.year, month.date.month, 0).getDate();
        const dailyAvg = totalTraffic / daysInMonth;
        rateCellText.textContent = `${formatVnstatBytes(dailyAvg)}/day`;
        
        rateCell.appendChild(rateCellText);
        row.appendChild(rateCell);
        
        tableBody.appendChild(row);
    });
}

/**
 * Update the top 10 traffic days table
 * @param {Object} data - VnStat data
 */
function updateTopTable(data) {
    const tableBody = document.querySelector('#vnstat-top10-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!data.day || data.day.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No top data available</td></tr>';
        return;
    }
    
    // Sort days by total traffic (highest first)
    const sortedDays = [...data.day].sort((a, b) => {
        const totalA = a.rx + a.tx;
        const totalB = b.rx + b.tx;
        return totalB - totalA;
    });
    
    // Take only the top 10 days
    const topDays = sortedDays.slice(0, 10);
    
    topDays.forEach((day, index) => {
        const row = document.createElement('tr');
        
        // Rank cell
        const rankCell = document.createElement('td');
        const rankCellDiv = document.createElement('div');
        rankCellDiv.className = 'd-flex px-2 py-1';
        
        const rankCellInnerDiv = document.createElement('div');
        rankCellInnerDiv.className = 'd-flex flex-column justify-content-center';
        
        const rankCellText = document.createElement('h6');
        rankCellText.className = 'mb-0 text-sm';
        rankCellText.textContent = `#${index + 1}`;
        
        rankCellInnerDiv.appendChild(rankCellText);
        rankCellDiv.appendChild(rankCellInnerDiv);
        rankCell.appendChild(rankCellDiv);
        row.appendChild(rankCell);
        
        // Date cell
        const dateCell = document.createElement('td');
        const dateCellText = document.createElement('p');
        dateCellText.className = 'text-sm font-weight-bold mb-0';
        
        const dateStr = `${day.date.year}-${day.date.month.toString().padStart(2, '0')}-${day.date.day.toString().padStart(2, '0')}`;
        dateCellText.textContent = dateStr;
        
        dateCell.appendChild(dateCellText);
        row.appendChild(dateCell);
        
        // Total traffic cell
        const totalTraffic = day.rx + day.tx;
        const totalCell = document.createElement('td');
        const totalCellText = document.createElement('p');
        totalCellText.className = 'text-sm font-weight-bold mb-0';
        totalCellText.textContent = formatVnstatBytes(totalTraffic);
        totalCell.appendChild(totalCellText);
        row.appendChild(totalCell);
        
        // Rate cell (download/upload percentages)
        const rateCell = document.createElement('td');
        const rateCellText = document.createElement('p');
        rateCellText.className = 'text-sm font-weight-bold mb-0';
        
        const rxPercentage = day.rx > 0 ? Math.round((day.rx / totalTraffic) * 100) : 0;
        const txPercentage = day.tx > 0 ? Math.round((day.tx / totalTraffic) * 100) : 0;
        rateCellText.textContent = `↓${rxPercentage}% ↑${txPercentage}%`;
        
        rateCell.appendChild(rateCellText);
        row.appendChild(rateCell);
        
        tableBody.appendChild(row);
    });
}

/**
 * Update the all-time statistics table
 * @param {Object} data - VnStat data
 */
function updateAlltimeStats(data) {
    if (!data.total) return;
    
    // Update since date
    const sinceElement = document.getElementById('vnstat-since-value');
    if (sinceElement && data.created) {
        const created = data.created;
        const sinceDate = `${created.date.year}-${created.date.month.toString().padStart(2, '0')}-${created.date.day.toString().padStart(2, '0')}`;
        sinceElement.textContent = `Since ${sinceDate}`;
    }
    
    // Update download
    const rxElement = document.getElementById('vnstat-rx');
    if (rxElement) {
        rxElement.textContent = formatVnstatBytes(data.total.rx);
    }
    
    // Update upload
    const txElement = document.getElementById('vnstat-tx');
    if (txElement) {
        txElement.textContent = formatVnstatBytes(data.total.tx);
    }
    
    // Update total
    const totalElement = document.getElementById('vnstat-total');
    if (totalElement) {
        totalElement.textContent = formatVnstatBytes(data.total.rx + data.total.tx);
    }
}

/**
 * Initialize VnStat functionality when the document is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if we have an active interface from the main script
    if (window.activeInterface) {
        updateAllVnstatTables(window.activeInterface);
    } else {
        // Default to eth0 if no active interface is set
        updateAllVnstatTables('eth0');
    }
    
    // Set up refresh interval (every 5 minutes)
    setInterval(function() {
        if (window.activeInterface) {
            updateAllVnstatTables(window.activeInterface);
        } else {
            updateAllVnstatTables('eth0');
        }
    }, 300000); // 5 minutes
});

// Export functions for use in other scripts
window.updateAllVnstatTables = updateAllVnstatTables;