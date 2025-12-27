# ResInfo API Documentation

## Pengantar

ResInfo API adalah antarmuka untuk mendapatkan informasi sistem dari perangkat OpenWrt. API ini menyediakan berbagai endpoint untuk mengakses informasi seperti status jaringan, penggunaan memori, penyimpanan, dan lainnya.

## Penggunaan Dasar

Semua permintaan API dilakukan melalui HTTP GET dengan parameter `action` yang menentukan jenis informasi yang ingin diambil.

Format URL dasar:
```
http://[IP_ADDRESS]/resinfo/api.php?action=[ACTION_NAME]
```

Dimana:
- `[IP_ADDRESS]` adalah alamat IP perangkat OpenWrt (misalnya 192.168.1.1)
- `[ACTION_NAME]` adalah nama tindakan yang ingin dilakukan

Semua respons dikembalikan dalam format JSON.

### Penggunaan di Terminal

Jika Anda menggunakan curl di terminal, gunakan format berikut:

```bash
# Di bash/sh/zsh
curl http://192.168.1.1/resinfo/api.php?action=getMemoryInfo

# Di fish shell (perlu escape character)
curl http://192.168.1.1/resinfo/api.php\?action\=getMemoryInfo
```

## Endpoint API yang Tersedia

### 1. Status Sistem

**Endpoint:** `api.php?action=getSystemStatus`

**Contoh:** `http://192.168.1.1/resinfo/api.php?action=getSystemStatus`

**Deskripsi:** Mengembalikan status sistem lengkap, termasuk:
- Informasi memori
- Informasi penyimpanan
- Suhu
- Traffic jaringan
- Interface aktif
- Informasi koneksi internet

**Contoh Respons:**
```json
{
  "connection": {
    "status": "Connected",
    "uptime": "21h 9m",
    "icon_class": "fa-check bg-gradient-primary"
  },
  "onlineUsers": 9,
  "cpuUsage": "3%",
  "memoryInfo": {
    "total": 2067296256,
    "free": 1268543488,
    "buffered": 3575808,
    "cached": 391180288,
    "available": 1632165888,
    "used": 798752768,
    "used_percent": "38.6%"
  },
  "storageInfo": {
    "total": 2146435072,
    "free": 1023737856,
    "used": 1122697216,
    "used_percent": "52%"
  },
  "temperature": "41°C",
  "firmwareVersion": "ImmortalWrt 24.10.1 r33048-cc720ea55a71",
  "ssid": "Aqila@5G",
  // ... data lainnya ...
}
```

### 2. Informasi Memori

**Endpoint:** `api.php?action=getMemoryInfo`

**Contoh:** `http://192.168.1.1/resinfo/api.php?action=getMemoryInfo`

**Deskripsi:** Mengembalikan informasi detail tentang penggunaan memori, termasuk:
- Total memori
- Memori bebas
- Memori buffer
- Memori cache
- Memori tersedia
- Memori yang digunakan
- Persentase penggunaan memori

**Contoh Respons:**
```json
{
  "memoryInfo": {
    "total": 2067296256,
    "free": 1262977024,
    "buffered": 3575808,
    "cached": 391507968,
    "available": 1626963968,
    "used": 804319232,
    "used_percent": "38.9%"
  }
}
```
- Memori yang digunakan
- Memori buffer
- Memori cache
- Persentase penggunaan memori

### 3. Informasi Penyimpanan

**Endpoint:** `api.php?action=getStorageInfo`

**Contoh:** `http://192.168.1.1/resinfo/api.php?action=getStorageInfo`

**Deskripsi:** Mengembalikan informasi tentang penyimpanan sistem, termasuk:
- Total ruang penyimpanan
- Ruang bebas
- Ruang yang digunakan
- Persentase penggunaan

**Contoh Respons:**
```json
{
  "storageInfo": {
    "total": 2146435072,
    "free": 1023729664,
    "used": 1122705408,
    "used_percent": "52%"
  }
}
```

### 4. Informasi Suhu

**Endpoint:** `api.php?action=getTemperature`

**Contoh:** `http://192.168.1.1/resinfo/api.php?action=getTemperature`

**Deskripsi:** Mengembalikan suhu sistem dalam derajat Celsius.

**Contoh Respons:**
```json
{
  "temperature": "42°C"
}
```

### 5. Informasi Interface Jaringan

**Endpoint:** `api.php?action=getInterfaces`

**Contoh:** `http://192.168.1.1/resinfo/api.php?action=getInterfaces`

**Deskripsi:** Mengembalikan daftar semua interface jaringan dengan informasi detail seperti:
- Nama interface
- Alamat MAC
- Tipe interface
- Status (up/down)
- Alamat IP
- Metrik
- DNS

**Contoh Respons:**
```json
[
  {
    "name": "br-lan",
    "macaddr": "6e:ed:22:ea:89:e7",
    "type": "bridge",
    "present": true,
    "carrier": true,
    "mtu": 1500,
    "interface_name": "lan",
    "up": true,
    "pending": false,
    "available": true,
    "autostart": true,
    "dynamic": false,
    "uptime": 76206,
    "proto": "static",
    "device": "br-lan",
    "metric": 0,
    "dns_metric": 0,
    "delegation": true,
    "ipv4_addresses": [
      {
        "address": "192.168.1.1",
        "mask": 24
      }
    ],
    // ... data lainnya ...
  },
  // ... interface lainnya ...
]
```

### 6. Interface Aktif

**Endpoint:** `api.php?action=getActiveInterfaces`

**Contoh:** `http://192.168.1.1/resinfo/api.php?action=getActiveInterfaces`

**Deskripsi:** Mengembalikan daftar interface jaringan yang aktif dengan informasi dasar.

**Catatan:** Endpoint ini tampaknya mengembalikan data yang sama dengan endpoint `traffic`.

### 7. Informasi Traffic Jaringan

**Endpoint:** `api.php?action=traffic&interface=[INTERFACE_NAME]`

**Contoh:** `http://192.168.1.1/resinfo/api.php?action=traffic&interface=eth0`

**Deskripsi:** Mengembalikan informasi traffic jaringan untuk interface tertentu, termasuk:
- Kecepatan download
- Kecepatan upload
- Total bytes diterima
- Total bytes dikirim
- Daftar semua interface

Parameter opsional:
- `interface`: Nama interface yang ingin dilihat (default: eth0)
- `reset`: Jika diatur ke 1, akan mereset statistik traffic

**Contoh Respons:**
```json
{
  "download": "15.35 KB/s",
  "upload": "51.31 KB/s",
  "download_value": 15.353255552457905,
  "upload_value": 51.31439020378965,
  "download_bytes": 15721.733685716895,
  "upload_bytes": 52545.93556868061,
  "total_rx": "8.13 GB",
  "total_tx": "895.54 MB",
  "unit": "KB/s",
  "interfaces": [
    // ... daftar interface ...
  ]
}
```

### 8. Data VnStat

**Endpoint:** `api.php?action=getVnstat&interface=[INTERFACE_NAME]&type=[TYPE]`

**Contoh:** `http://192.168.1.1/resinfo/api.php?action=getVnstat&interface=eth0&type=hours`

**Deskripsi:** Mengembalikan data statistik jaringan dari VnStat, termasuk:
- Data penggunaan per jam
- Data penggunaan per hari
- Data penggunaan per minggu
- Data penggunaan per bulan

Parameter opsional:
- `interface`: Nama interface yang ingin dilihat (default: eth0)
- `type`: Tipe data yang ingin diambil (hours, days, weeks, months, top10, alltime)

## Contoh Penggunaan

### Mendapatkan Status Sistem

```
http://192.168.1.1/resinfo/api.php?action=getSystemStatus
```

### Mendapatkan Informasi Traffic untuk Interface eth1

```
http://192.168.1.1/resinfo/api.php?action=traffic&interface=eth1
```

### Mendapatkan Data VnStat

```
http://192.168.1.1/resinfo/api.php?action=getVnstat&interface=eth0&type=hours
```

## Tabel Ringkasan Endpoint API

| Endpoint | Deskripsi | Parameter | Contoh URL |
|----------|-----------|-----------|------------|
| `getSystemStatus` | Status sistem lengkap | - | `http://192.168.1.1/resinfo/api.php?action=getSystemStatus` |
| `getMemoryInfo` | Informasi memori | - | `http://192.168.1.1/resinfo/api.php?action=getMemoryInfo` |
| `getStorageInfo` | Informasi penyimpanan | - | `http://192.168.1.1/resinfo/api.php?action=getStorageInfo` |
| `getTemperature` | Suhu sistem | - | `http://192.168.1.1/resinfo/api.php?action=getTemperature` |
| `getInterfaces` | Daftar interface jaringan | - | `http://192.168.1.1/resinfo/api.php?action=getInterfaces` |
| `getActiveInterfaces` | Interface jaringan aktif | - | `http://192.168.1.1/resinfo/api.php?action=getActiveInterfaces` |
| `traffic` | Informasi traffic jaringan | `interface`, `reset` | `http://192.168.1.1/resinfo/api.php?action=traffic&interface=eth0` |
| `getVnstat` | Data statistik jaringan | `interface`, `type` | `http://192.168.1.1/resinfo/api.php?action=getVnstat&interface=eth0&type=hours` |
| `getFirmwareVersion` | Versi firmware | - | `http://192.168.1.1/resinfo/api.php?action=getFirmwareVersion` |
| `getSSID` | SSID WiFi | - | `http://192.168.1.1/resinfo/api.php?action=getSSID` |
| `getPublicIP` | IP publik dan ISP | - | `http://192.168.1.1/resinfo/api.php?action=getPublicIP` |

## Catatan

- Semua nilai memori dan penyimpanan dikembalikan dalam byte
- Nilai traffic jaringan dikembalikan dalam format yang mudah dibaca (misalnya "1.2 MB/s")
- Status interface menunjukkan apakah interface tersebut up (aktif) atau down (tidak aktif)
- Endpoint `getActiveInterfaces` tampaknya mengembalikan data yang sama dengan endpoint `traffic`
- Endpoint `getVnstat` mungkin memerlukan paket vnstat terinstal di sistem

## Troubleshooting

Jika Anda mengalami masalah dengan API:

1. Pastikan perangkat OpenWrt Anda dapat diakses melalui jaringan
2. Periksa apakah layanan ubus berjalan di perangkat
3. Pastikan Anda memiliki izin yang tepat untuk mengakses API
4. Jika menggunakan curl di terminal fish shell, gunakan escape character (\) sebelum karakter khusus

Untuk masalah lebih lanjut, periksa log sistem OpenWrt Anda.
