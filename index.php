<?php
// Setup error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

$systemInfo = [
    'connection' => ['uptime' => '0d 0h 0m'],
    'cpuUsage' => '0%',
    'memoryInfo' => ['used_percent' => '0%'],
    'onlineUsers' => '0'
];

$networkTraffic = [
    'download' => '0 B/s',
    'upload' => '0 B/s',
    'interfaces' => [
        [
            'name' => 'eth0',
            'type' => 'ethernet',
            'up' => true
        ]
    ]
];

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title>Openwrt System monitor</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">

  <!-- Icons -->
  <link href="./assets/css/nucleo-icons.css" rel="stylesheet" />
  <link href="./assets/css/nucleo-svg.css" rel="stylesheet" />
  <link href="./assets/css/all.min.css" rel="stylesheet" />
  
  <!-- CSS Files -->
  <link id="pagestyle" href="./assets/css/argon-dashboard.min.css" rel="stylesheet" />
  
  <!-- Minimal custom CSS for scrolling tabs and mobile responsiveness -->
  <style>
    /* CSS to make tab interface horizontally scrollable */
    .scrollable-tabs-container {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin-bottom: 1rem;
    }
    
    .scrollable-tabs-container .nav {
      flex-wrap: nowrap;
      padding-bottom: 4px; /* Add space below tabs */
    }
    
    .scrollable-tabs-container .nav-item {
      white-space: nowrap;
    }
    
    .scrollable-tabs-container .nav-link {
      padding: 0.5rem 0.75rem;
    }
    
    /* Fix padding for cards on mobile view */
    @media (max-width: 767.98px) {
      .card-body {
        padding: 0.75rem !important;
      }
      
      .numbers h5 {
        font-size: 1rem;
      }
      
      .numbers p {
        font-size: 0.7rem;
      }
      
      .icon-shape.icon-sm {
        width: 30px;
        height: 30px;
      }
      
      /* Perbaikan untuk tab interface */
      .scrollable-tabs-container .nav-link {
        font-size: 0.8rem;
        padding: 0.5rem 0.6rem;
      }
      
      /* Perbaikan untuk container utama */
      .container-fluid {
        padding: 0.75rem;
      }
      
      /* Perbaikan untuk table responsive */
      .table-responsive {
        font-size: 0.8rem;
      }
      
      /* Atur ulang margin dan padding untuk card */
      .row > [class*="col-"] {
        padding-right: 8px;
        padding-left: 8px;
      }
      
      .row {
        margin-right: -8px;
        margin-left: -8px;
      }
      
      /* Tambahkan ini: */
      .row > .col-xl-3,
      .row > .col-sm-6 {
        flex: 0 0 50%;
        max-width: 50%;
      }
    }

    /* Tambahan untuk responsivitas tabel */
    .table-responsive {
      overflow-x: auto;
    }

    /* Gaya tambahan untuk teks kecil di mobile */
    @media (max-width: 575.98px) {
      .text-sm {
        font-size: 0.8rem !important;
      }
      .text-xs {
        font-size: 0.7rem !important;
      }
    }
    
    /* Perbaikan untuk tampilan window mode (ukuran medium) */
    @media (min-width: 768px) and (max-width: 1199.98px) {
      /* Perbaikan untuk card status proses */
      .process-status-container .row {
        margin: 0 -3px;  /* Kurangi margin untuk layout yang lebih compact */
      }
      .process-status-container .col-md-4, .process-status-container .col-4 {
        padding: 0 3px;  /* Kurangi padding untuk layout yang lebih compact */
        flex: 0 0 33.333333%;
        max-width: 33.333333%;
      }
      .process-status-container .card {
        margin-bottom: 6px;  /* Kurangi margin bottom */
        height: 100%;
        overflow: hidden;  /* Tambahkan overflow hidden untuk mencegah teks keluar */
      }
      .process-status-container .card-body {
        padding: 0.4rem 0.3rem;  /* Kurangi padding */
        text-align: center;  /* Tambahkan text-align center */
      }
      /* Pastikan teks tidak terpotong */
      .process-status-container .text-sm {
        font-size: 0.65rem !important;  /* Kurangi ukuran font */
        white-space: nowrap;  /* Tambahkan white-space nowrap */
        overflow: hidden;  /* Tambahkan overflow hidden */
        text-overflow: ellipsis;  /* Tambahkan text-overflow ellipsis */
      }
      .process-status-container .text-xs {
        font-size: 0.6rem !important;  /* Kurangi ukuran font */
        white-space: nowrap;  /* Tambahkan white-space nowrap */
        overflow: hidden;  /* Tambahkan overflow hidden */
        text-overflow: ellipsis;  /* Tambahkan text-overflow ellipsis */
      }
      
      /* Perbaikan untuk info sistem */
      .system-info-list .info-item {
        margin-bottom: 0.5rem;
      }
      
      /* Perbaikan ukuran font */
      .badge {
        font-size: 65% !important;
        padding: 0.25rem 0.4rem !important;
      }
      .text-xxs {
        font-size: 65% !important;
      }
    }
  </style>
</head>

<body class="g-sidenav-show bg-gray-100">
  <!-- Background gradient header -->
  <div class="min-height-300 bg-primary position-absolute w-100"></div>
  
  <main class="main-content position-relative border-radius-lg ps-0">
    <!-- Navbar - Header with title and update time (Mobile responsive) -->
    <nav class="navbar navbar-main navbar-expand-lg px-0 mx-4 shadow-none border-radius-xl" id="navbarBlur" data-scroll="false">
      <div class="container-fluid py-1 px-2 px-md-3">
        <nav aria-label="breadcrumb">
          <h6 class="font-weight-bolder text-white mb-0">Network Traffic Monitor</h6>
        </nav>
        <div class="mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
          <div class="ms-md-auto d-flex align-items-center">
            <!-- Element to display last update time -->
            <span class="text-white opacity-8 text-xs">
              <i class="fas fa-sync-alt me-1"></i>
              <span id="lastUpdateTime">Update now</span>
              <script>
                // Update last time every second
                setInterval(function() {
                  const updateElement = document.getElementById('lastUpdateTime');
                  if (window.lastUpdateTimestamp) {
                    const secondsAgo = Math.floor((Date.now() - window.lastUpdateTimestamp) / 1000);
                    if (secondsAgo < 60) {
                      updateElement.textContent = `Updated ${secondsAgo} seconds ago`;
                    } else if (secondsAgo < 3600) {
                      updateElement.textContent = `Updated ${Math.floor(secondsAgo / 60)} minutes ago`;
                    } else {
                      updateElement.textContent = `Updated ${Math.floor(secondsAgo / 3600)} hours ago`;
                    }
                  }
                }, 1000);
              </script>
            </span>
          </div>
        </div>
      </div>
    </nav>
    <!-- End Navbar -->
    
    <div class="container-fluid py-4">
      <!-- System Info Cards -->
      <div class="row">
        <!-- Card 1: Uptime - Argon Dashboard card style -->
        <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div class="card">
            <div class="card-body p-3">
              <div class="row">
                <div class="col-8">
                  <div class="numbers">
                    <p class="text-sm mb-0 text-uppercase font-weight-bold">Uptime</p>
                    <h5 class="font-weight-bolder" id="system-uptime">
                      <?php echo isset($systemInfo['connection']['uptime']) ? $systemInfo['connection']['uptime'] : '0d 0h 0m'; ?>
                    </h5>
                    <div class="progress mt-1" style="height: 6px;">
                      <div class="progress-bar uptime-progress-bar bg-gradient-primary" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                </div>
                <div class="col-4 text-end">
                  <div class="icon icon-shape bg-gradient-primary shadow-primary text-center rounded-circle">
                    <i class="ni ni-watch-time text-lg opacity-10" aria-hidden="true"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Card 2: Online Users - Argon Dashboard card style -->
        <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div class="card">
            <div class="card-body p-3">
              <div class="row">
                <div class="col-8">
                  <div class="numbers">
                    <p class="text-sm mb-0 text-uppercase font-weight-bold">Online Users</p>
                    <h5 class="font-weight-bolder" id="online-users">
                      <?php echo isset($systemInfo['onlineUsers']) ? $systemInfo['onlineUsers'] : '0'; ?>
                    </h5>
                    <div class="progress mt-1" style="height: 6px;">
                      <div class="progress-bar users-progress-bar bg-gradient-info" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                </div>
                <div class="col-4 text-end">
                  <div class="icon icon-shape bg-gradient-info shadow-info text-center rounded-circle">
                    <i class="fas fa-users text-lg opacity-10" aria-hidden="true"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Card 3: CPU Usage - Argon Dashboard card style -->
        <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
          <div class="card">
            <div class="card-body p-3">
              <div class="row">
                <div class="col-8">
                  <div class="numbers">
                    <p class="text-sm mb-0 text-uppercase font-weight-bold">CPU Usage</p>
                    <h5 class="font-weight-bolder" id="cpu-usage">
                      <?php echo isset($systemInfo['cpuUsage']) ? $systemInfo['cpuUsage'] : '0%'; ?>
                    </h5>
                    <div class="progress mt-1" style="height: 6px;">
                      <div class="progress-bar cpu-progress-bar bg-gradient-danger" role="progressbar" style="width: <?php echo isset($systemInfo['cpuUsage']) ? str_replace('%', '', $systemInfo['cpuUsage']) : '0'; ?>%" aria-valuenow="<?php echo isset($systemInfo['cpuUsage']) ? str_replace('%', '', $systemInfo['cpuUsage']) : '0'; ?>" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                </div>
                <div class="col-4 text-end">
                  <div class="icon icon-shape bg-gradient-danger shadow-danger text-center rounded-circle">
                    <i class="fas fa-microchip text-lg opacity-10" aria-hidden="true"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Card 4: Memory Usage - Argon Dashboard card style -->
        <div class="col-xl-3 col-sm-6">
          <div class="card">
            <div class="card-body p-3">
              <div class="row">
                <div class="col-8">
                  <div class="numbers">
                    <p class="text-sm mb-0 text-uppercase font-weight-bold">Memory Usage</p>
                    <h5 class="font-weight-bolder" id="memory-usage">
                      <?php echo isset($systemInfo['memoryInfo']['used_percent']) ? $systemInfo['memoryInfo']['used_percent'] : '0%'; ?>
                    </h5>
                    <div class="progress mt-1" style="height: 6px;">
                      <div class="progress-bar memory-progress-bar bg-gradient-success" role="progressbar" style="width: <?php echo isset($systemInfo['memoryInfo']['used_percent']) ? str_replace('%', '', $systemInfo['memoryInfo']['used_percent']) : '0'; ?>%" aria-valuenow="<?php echo isset($systemInfo['memoryInfo']['used_percent']) ? str_replace('%', '', $systemInfo['memoryInfo']['used_percent']) : '0'; ?>" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                </div>
                <div class="col-4 text-end">
                  <div class="icon icon-shape bg-gradient-success shadow-success text-center rounded-circle">
                    <i class="fas fa-memory text-lg opacity-10" aria-hidden="true"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Traffic Monitoring & Interface Details Row -->
      <div class="row mt-4">
        <div class="col-lg-9">
          <!-- Traffic Monitoring Card -->
          <div class="card z-index-2 mb-4">
            <!-- Card header with tabs for interface selection -->
            <div class="card-header pb-4">
              <h6>Traffic monitor</h6>
              
              <!-- Interface Selector Tabs -->
              <div class="scrollable-tabs-container">
                <ul class="nav nav-tabs mb-3" id="interfaceSelector">
                  <?php
                  // Debug: print interfaces for troubleshooting
                  error_log('Available interfaces: ' . print_r($networkTraffic['interfaces'], true));
                  
                  // Make sure we have interface list from $networkTraffic
                  $interfaces = $networkTraffic['interfaces'] ?? [];
                  
                  // Loop through all available interfaces
                  foreach ($interfaces as $index => $iface):
                      // Skip if interface doesn't have a name
                      if (!isset($iface['name'])) continue;
                      
                      $isActive = $index === 0;  // First interface is active
                      $name = $iface['name'];
                      $type = $iface['type'] ?? 'unknown';
                      $status = $iface['up'] ? 'up' : 'down';
                  ?>
                  <li class="nav-item">
                    <button class="nav-link <?php echo $isActive ? 'active' : ''; ?>"
                            data-bs-toggle="tab" 
                            data-interface="<?php echo htmlspecialchars($name); ?>"
                            type="button">
                      <?php 
                      // Display interface name and type
                      echo htmlspecialchars($name);
                      echo ' <small class="text-muted">(' . htmlspecialchars($type) . ')</small>';
                      
                      // Display status indicator
                      if ($status === 'up') {
                          echo ' <i class="fas fa-check-circle text-success"></i>';
                      } else {
                          echo ' <i class="fas fa-times-circle text-danger"></i>';
                      }
                      ?>
                    </button>
                  </li>
                  <?php 
                  endforeach;
                  
                  // Display message if no interfaces found
                  if (empty($interfaces)):
                  ?>
                  <li class="nav-item">
                      <button class="nav-link active" data-interface="eth0" type="button">
                          eth0 <small class="text-muted">(default)</small>
                      </button>
                  </li>
                  <?php endif;
                  ?>
                </ul>
              </div>
              
              <!-- Display current speed - Menggunakan class responsif Bootstrap yang lebih baik -->
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center">
                <p class="text-sm fw-bold mb-2 mb-md-0 me-md-4">
                  <i class="fa fa-arrow-down text-primary me-1"></i>
                  Download: <span id="downloadSpeedText"><?php echo $networkTraffic['download'] ?? '0 B/s'; ?></span>
                </p>
                <p class="text-sm fw-bold mb-0">
                  <i class="fa fa-arrow-up text-success me-1"></i>
                  Upload: <span id="uploadSpeedText"><?php echo $networkTraffic['upload'] ?? '0 B/s'; ?></span>
                </p>
              </div>
            </div>
            <!-- Card body with chart -->
            <div class="card-body p-3">
              <div class="chart">
                <!-- Canvas for Chart.js -->
                <canvas id="trafficChart" class="chart-canvas" width="400" height="300"></canvas>
              </div>
            </div>
          </div>
          
          <!-- Interface Details Card -->
          <div class="card">
            <div class="card-header p-3 pb-0 d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Interface Details</h6>
                <button id="refreshInterfaceBtn" class="btn btn-sm btn-outline-primary">Refresh</button>
              </div>
            <!-- Table to display interface details using Bootstrap responsive table -->
            <div class="card-body px-0 pt-0 pb-2">
              <div class="table-responsive">
                <table class="table align-items-center mb-0">
                  <thead>
                    <tr>
                      <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Interface</th>
                      <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">IP Address</th>
                      <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">DNS</th>
                      <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Status</th>
                    </tr>
                  </thead>
                  <tbody id="interfaceDetailsList">
                    <!-- Data will be filled by JavaScript -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- VnStat Data Cards Row -->
          <div class="row mt-4">
            <!-- Daily Card -->
            <div class="col-lg-4 mb-4">
              <div class="card h-100">
                <div class="card-header pb-0">
                  <h6>Traffic Daily</h6>
                  <p class="text-sm mb-0">
                    <span class="font-weight-bold">Daily traffic statistics</span>
                  </p>
                </div>
                <div class="card-body p-3">
                  <div class="table-responsive">
                    <table class="table align-items-center mb-0" id="vnstat-days-table">
                      <thead>
                        <tr>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Day</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Total</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- Data will be filled by JavaScript -->
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Weeks Card -->
            <div class="col-lg-4 mb-4">
              <div class="card h-100">
                <div class="card-header pb-0">
                  <h6>Traffic Weeks</h6>
                  <p class="text-sm mb-0">
                    <span class="font-weight-bold">Weekly traffic statistics</span>
                  </p>
                </div>
                <div class="card-body p-3">
                  <div class="table-responsive">
                    <table class="table align-items-center mb-0" id="vnstat-weeks-table">
                      <thead>
                        <tr>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Period</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Total</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- Data will be filled by JavaScript -->
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Months Card -->
            <div class="col-lg-4 mb-4">
              <div class="card h-100">
                <div class="card-header pb-0">
                  <h6>Traffic Months</h6>
                  <p class="text-sm mb-0">
                    <span class="font-weight-bold">Monthly traffic statistics</span>
                  </p>
                </div>
                <div class="card-body p-3">
                  <div class="table-responsive">
                    <table class="table align-items-center mb-0" id="vnstat-months-table">
                      <thead>
                        <tr>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Month</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Total</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- Data will be filled by JavaScript -->
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Top 10 and All-time Cards Row -->
          <div class="row mt-0">
            <!-- Top 10 Card -->
            <div class="col-lg-8 mb-4">
              <div class="card h-100">
                <div class="card-header pb-0">
                  <h6>Top 10 Traffic Days</h6>
                  <p class="text-sm mb-0">
                    <span class="font-weight-bold">Highest traffic days</span>
                  </p>
                </div>
                <div class="card-body p-3">
                  <div class="table-responsive">
                    <table class="table align-items-center mb-0" id="vnstat-top10-table">
                      <thead>
                        <tr>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">#</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Date</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Total</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- Data will be filled by JavaScript -->
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- All-time Card -->
            <div class="col-lg-4 mb-4">
              <div class="card h-100">
                <div class="card-header pb-0">
                  <h6>All-time Statistics</h6>
                  <p class="text-sm mb-0">
                    <span class="font-weight-bold">Total traffic usage</span>
                  </p>
                </div>
                <div class="card-body p-3">
                  <div class="table-responsive">
                    <table class="table align-items-center mb-0" id="vnstat-alltime-table">
                      <thead>
                        <tr>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Total</th>
                          <th class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2" id="vnstat-since-value">Loading...</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div class="d-flex px-2 py-1">
                              <div class="d-flex flex-column justify-content-center">
                                <h6 class="mb-0 text-sm">Download</h6>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p class="text-sm font-weight-bold mb-0" id="vnstat-rx">Loading...</p>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="d-flex px-2 py-1">
                              <div class="d-flex flex-column justify-content-center">
                                <h6 class="mb-0 text-sm">Upload</h6>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p class="text-sm font-weight-bold mb-0" id="vnstat-tx">Loading...</p>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="d-flex px-2 py-1">
                              <div class="d-flex flex-column justify-content-center">
                                <h6 class="mb-0 text-sm">Usage</h6>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p class="text-sm font-weight-bold mb-0" id="vnstat-total">Loading...</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Network Status Card - Responsive design untuk mobile view -->
        <div class="col-lg-3">
          <div class="card h-100">
            <div class="card-header pb-0">
              <h6>Network Status</h6>
            </div>
            <div class="card-body p-3">
              <!-- Connection Status -->
              <div class="d-flex align-items-center mb-3">
                <div class="icon icon-shape icon-sm bg-gradient-<?php echo isset($systemInfo['connection']['status']) && $systemInfo['connection']['status'] === 'Connected' ? 'success' : 'danger'; ?> text-white text-center me-2 rounded-circle">
                  <i class="fas fa-network-wired opacity-10"></i>
                </div>
                <p class="text-sm mb-0">
                  Status: <span class="fw-bold" id="connection-status">
                    <?php echo isset($systemInfo['connection']['status']) ? $systemInfo['connection']['status'] : 'Tidak Diketahui'; ?>
                  </span>
                </p>
              </div>
              
              <!-- Local IP Address -->
              <div class="d-flex align-items-center mb-3">
                <div class="icon icon-shape icon-sm bg-gradient-info text-white text-center me-2 rounded-circle">
                  <i class="fas fa-network-wired opacity-10"></i>
                </div>
                <p class="text-sm mb-0">
                  Local IP: <span class="fw-bold" id="main-ip">
                    <?php 
                    // Ambil IP address dari interface pertama jika ada
                    $mainIp = '';
                    if (!empty($networkTraffic['interfaces'])) {
                        $mainInterface = $networkTraffic['interfaces'][0];
                        if (!empty($mainInterface['ipv4_addresses'])) {
                            $mainIp = $mainInterface['ipv4_addresses'][0]['address'];
                        }
                    }
                    echo $mainIp ?: '192.168.1.1';
                  ?>
                  </span>
                </p>
              </div>
              
              <!-- Public IP Address -->
              <div class="d-flex align-items-center mb-3">
                <div class="icon icon-shape icon-sm bg-gradient-success text-white text-center me-2 rounded-circle">
                  <i class="fas fa-globe opacity-10"></i>
                </div>
                <div class="mb-0 flex-grow-1">
                  <p class="text-sm mb-0">
                    Public IP: <span class="fw-bold" id="public-ip">
                      <?php 
                      // Ambil IP publik dari system info jika ada
                      echo isset($systemInfo['publicIP']['ip']) ? $systemInfo['publicIP']['ip'] : 'Memuat...';
                      ?>
                    </span>
                  </p>
                  <p class="text-xs text-muted mb-0" id="public-isp">
                    <?php
                    // Tampilkan ISP jika tersedia
                    echo isset($systemInfo['publicIP']['isp']) ? $systemInfo['publicIP']['isp'] : 'Memuat info ISP...';
                    ?>
                  </p>
                </div>
              </div>
              
              <!-- Ping Time -->
              <div class="d-flex align-items-center mb-3">
                <div class="icon icon-shape icon-sm bg-gradient-warning text-white text-center me-2 rounded-circle">
                  <i class="fas fa-tachometer-alt opacity-10"></i>
                </div>
                <p class="text-sm mb-0">
                  Ping: <span class="font-weight-bold" id="ping-time" 
                  <?php 
                    // Tetapkan warna berdasarkan nilai ping
                    $pingValue = isset($systemInfo['pingTime']) ? $systemInfo['pingTime'] : '0 ms';
                    $pingClass = 'text-success'; // Default: ping bagus
                    
                    if ($pingValue === 'Timeout') {
                        $pingClass = 'text-danger'; // Merah untuk timeout
                    } else {
                        // Ekstrak nilai numerik dari string ping
                        preg_match('/(\d+(\.\d+)?)/', $pingValue, $matches);
                        if (!empty($matches)) {
                            $pingMs = (float)$matches[1];
                            if ($pingMs > 200) {
                                $pingClass = 'text-danger'; // Merah untuk ping buruk (> 200ms)
                            } else if ($pingMs > 100) {
                                $pingClass = 'text-warning'; // Kuning untuk ping sedang (100-200ms)
                            }
                        }
                    }
                    echo "class=\"$pingClass\"";
                  ?>
                  >
                    <?php echo $pingValue; ?>
                  </span>
                </p>
              </div>
              
              <!-- Last Updated -->
              <div class="d-flex align-items-center">
                <div class="icon icon-shape icon-sm bg-gradient-primary text-white text-center me-2 rounded-circle">
                  <i class="fas fa-clock opacity-10"></i>
                </div>
                <p class="text-sm mb-0">
                  Update: <span class="font-weight-bold" id="last-update-time">
                    <?php echo isset($systemInfo['timestamp']) ? $systemInfo['timestamp'] : date('Y-m-d H:i:s'); ?>
                  </span>
                </p>
              </div>
              
              <hr class="horizontal dark my-3">
            
              <div class="card card-sm mb-3">
                <div class="card-header p-2 pb-0">
                  <div class="d-flex align-items-center">
                    <div class="icon icon-shape icon-sm bg-gradient-danger text-white text-center me-2 rounded-circle">
                      <i class="fas fa-memory opacity-10"></i>
                    </div>
                    <h6 class="mb-0 text-sm">Memory</h6>
                  </div>
                </div>
                <div class="card-body p-2 pt-0">
                  <!-- Memory Progress -->
                  <div class="d-flex justify-content-between align-items-center mb-1 mt-2">
                    <p class="text-xs mb-0">Usage</p>
                    <p class="text-xs font-weight-bold mb-0" id="memory-value">Loading...</p>
                  </div>
                  <div class="progress" style="height: 4px">
                    <div class="progress-bar bg-gradient-danger" id="memory-progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>
                  </div>
                  
                  <!-- Memory Details -->
                  <div class="table-responsive mt-2">
                    <table class="table table-sm align-items-center mb-0">
                      <tbody>
                        <tr>
                          <td class="text-xs">Total</td>
                          <td class="text-xs text-end font-weight-bold" id="memory-total">Loading...</td>
                        </tr>
                        <tr>
                          <td class="text-xs">Free</td>
                          <td class="text-xs text-end font-weight-bold" id="memory-free">Loading...</td>
                        </tr>
                        <tr>
                          <td class="text-xs">Cached</td>
                          <td class="text-xs text-end font-weight-bold" id="memory-cached">Loading...</td>
                        </tr>
                        <tr>
                          <td class="text-xs">Buffered</td>
                          <td class="text-xs text-end font-weight-bold" id="memory-buffered">Loading...</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <!-- Storage Details -->
              <div class="card card-sm mb-3">
                <div class="card-header p-2 pb-0">
                  <div class="d-flex align-items-center">
                    <div class="icon icon-shape icon-sm bg-gradient-primary text-white text-center me-2 rounded-circle">
                      <i class="fas fa-hdd opacity-10"></i>
                    </div>
                    <h6 class="mb-0 text-sm">Storage</h6>
                  </div>
                </div>
                <div class="card-body p-2 pt-0">
                  <!-- Storage Progress -->
                  <div class="d-flex justify-content-between align-items-center mb-1 mt-2">
                    <p class="text-xs mb-0">Usage</p>
                    <p class="text-xs font-weight-bold mb-0" id="storage-value">Loading...</p>
                  </div>
                  <div class="progress" style="height: 4px">
                    <div class="progress-bar bg-gradient-primary" id="storage-progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>
                  </div>
                  
                  <!-- Storage Details -->
                  <div class="table-responsive mt-2">
                    <table class="table table-sm align-items-center mb-0">
                      <tbody>
                        <tr>
                          <td class="text-xs">Total</td>
                          <td class="text-xs text-end font-weight-bold" id="storage-total">Loading...</td>
                        </tr>
                        <tr>
                          <td class="text-xs">Free</td>
                          <td class="text-xs text-end font-weight-bold" id="storage-free">Loading...</td>
                        </tr>
                        <tr>
                          <td class="text-xs">Used</td>
                          <td class="text-xs text-end font-weight-bold" id="storage-used">Loading...</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              
              <hr class="horizontal dark my-3">
              
              <!-- Process Status Container -->
              <div class="card card-sm mb-3">
                <div class="card-header p-2 pb-0">
                  <div class="d-flex align-items-center">
                    <div class="icon icon-shape icon-sm bg-gradient-success text-white text-center me-2 rounded-circle">
                      <i class="fas fa-server opacity-10"></i>
                    </div>
                    <h6 class="mb-0 text-sm">Tunnel Services</h6>
                  </div>
                </div>
                <div class="card-body p-2 pt-0">
                  <!-- Process Status akan diisi oleh JavaScript -->
                  <div class="process-status-container mt-2">
                    <div class="text-center py-2">
                      <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                      <p class="text-xs mb-0 mt-1">Memuat status proses...</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- System Progress Container -->
              <div class="card card-sm mb-3">
                <div class="card-header p-2 pb-0">
                  <div class="d-flex align-items-center">
                    <div class="icon icon-shape icon-sm bg-gradient-warning text-white text-center me-2 rounded-circle">
                      <i class="fas fa-chart-line opacity-10"></i>
                    </div>
                    <h6 class="mb-0 text-sm">System Resources</h6>
                  </div>
                </div>
                <div class="card-body p-2 pt-0">
                  <!-- System Progress akan diisi oleh JavaScript -->
                  <div class="system-progress-container mt-2">
                    <div class="text-center py-2">
                      <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                      <p class="text-xs mb-0 mt-1">Memuat progress sistem...</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- System Services Container -->
              <div class="card card-sm mb-3">
                <div class="card-header p-2 pb-0">
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                      <div class="icon icon-shape icon-sm bg-gradient-info text-white text-center me-2 rounded-circle shadow">
                        <i class="fas fa-cogs opacity-10"></i>
                      </div>
                      <h6 class="mb-0 text-sm">Running Services</h6>
                    </div>
                    <div class="dropdown">
                      <button id="refreshServicesBtn" class="btn btn-sm btn-outline-info mb-0 p-1 px-2 me-1">
                        <i class="fas fa-sync-alt"></i>
                      </button>
                      <button class="btn btn-sm btn-info mb-0 p-1 px-2 dropdown-toggle" type="button" id="servicesDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <span id="services-count">0</span>
                      </button>
                      <div class="dropdown-menu dropdown-menu-end px-2" aria-labelledby="servicesDropdown" style="max-height: 300px; overflow-y: auto; min-width: 300px;">
                        <div class="table-responsive">
                          <table class="table table-sm align-items-center mb-0">
                            <thead>
                              <tr>
                                <th class="text-uppercase text-xxs font-weight-bolder opacity-7">PID</th>
                                <th class="text-uppercase text-xxs font-weight-bolder opacity-7">Service</th>
                                <th class="text-uppercase text-xxs font-weight-bolder opacity-7">Memory</th>
                              </tr>
                            </thead>
                            <tbody id="services-list">
                              <tr>
                                <td colspan="3" class="text-center py-2">
                                  <div class="spinner-border spinner-border-sm text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                  </div>
                                  <p class="text-xs mb-0 mt-1">Memuat daftar service...</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="card-body p-2 pt-0">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <p class="text-xs mb-0">Total services running</p>
                      <h5 class="font-weight-bolder mb-0" id="services-count-display">0</h5>
                    </div>
                    <div class="text-end">
                      <p class="text-xs mb-0">Top memory usage</p>
                      <p class="text-sm font-weight-bold mb-0" id="top-service-memory">-</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- System Logs Container -->
              <div class="card card-sm mb-0">
                <div class="card-header p-2 pb-0">
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                      <div class="icon icon-shape icon-sm bg-gradient-danger text-white text-center me-2 rounded-circle shadow">
                        <i class="fas fa-file-alt opacity-10"></i>
                      </div>
                      <h6 class="mb-0 text-sm">System Logs</h6>
                    </div>
                    <button id="refreshLogsBtn" class="btn btn-sm btn-outline-danger mb-0 p-1 px-2">
                      <i class="fas fa-sync-alt"></i>
                    </button>
                  </div>
                </div>
                <div class="card-footer p-0 text-center">
                  <a href="#" class="text-muted py-1 d-block" data-bs-toggle="collapse" data-bs-target="#collapseSystemLogs" aria-expanded="false" aria-controls="collapseSystemLogs">
                    <i class="fas fa-chevron-down"></i> Show Log
                  </a>
                </div>
                <div class="collapse" id="collapseSystemLogs">
                  <div class="card-body p-2 pt-0">
                    <div class="log-container bg-light p-2 rounded" style="max-height: 100px; overflow-y: auto;">
                      <pre id="system-logs" class="text-xs mb-0" style="white-space: pre-wrap;">Loading system logs...</pre>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  
  <!-- Core JS Files -->
  <script src="./assets/js/core/popper.min.js"></script>
  <script src="./assets/js/core/bootstrap.min.js"></script>
  <script src="./assets/js/plugins/perfect-scrollbar.min.js"></script>
  <script src="./assets/js/plugins/smooth-scrollbar.min.js"></script>
  <script src="./assets/js/plugins/chart.js"></script>
  
  <!-- Traffic Monitoring JavaScript -->
  <script src="./assets/js/resinfo.js"></script>
  
  <!-- VnStat Data Handling JavaScript -->
  <script src="./assets/js/vnstat.js"></script>
  
  <!-- Additional JavaScript untuk menangani interface dan vnstat data -->
  <script>
    // Inisialisasi data saat halaman dimuat
    document.addEventListener('DOMContentLoaded', function() {
      // Perbarui data vnstat untuk interface aktif
      const activeInterface = '<?php echo isset($networkTraffic["interfaces"][0]["name"]) ? $networkTraffic["interfaces"][0]["name"] : "eth0"; ?>';
      window.activeInterface = activeInterface;
      
      // Update semua tabel VnStat
      updateAllVnstatTables(activeInterface);
      
      // Tambahkan event listener untuk tab interface
      document.querySelectorAll('#interfaceSelector .nav-link').forEach(tab => {
        tab.addEventListener('click', function() {
          const interface = this.getAttribute('data-interface');
          window.activeInterface = interface;
          // Update data vnstat untuk interface yang dipilih
          updateAllVnstatTables(interface);
        });
      });
    });
  </script>