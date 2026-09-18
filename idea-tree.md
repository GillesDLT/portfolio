# Document Title
<html>
<head>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        :root {
            --primary: #0B132B;
            --secondary: #1C2541;
            --accent-blue: #3A506B;
            --accent-teal: #5BC0BE;
            --accent-cyan: #6FFFE9;
            --text-light: #E9ECEF;
            --text-dark: #212529;
            --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            --glow: 0 0 15px rgba(91, 192, 190, 0.5);
        }
        
        body {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--text-light);
            display: flex;
            flex-direction: column;
            height: 100vh;
            padding: 20px;
            overflow: hidden;
        }
        
        .container {
            width: 100%;
            max-width: 700px;
            height: 700px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            background-color: rgba(28, 37, 65, 0.7);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            box-shadow: var(--shadow);
            border: 1px solid rgba(111, 255, 233, 0.2);
            overflow: hidden;
        }
        
        .header {
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(111, 255, 233, 0.2);
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 500;
            letter-spacing: 0.5px;
            color: var(--accent-cyan);
        }
        
        .search-container {
            position: relative;
            width: 50%;
        }
        
        .search {
            width: 100%;
            padding: 10px 15px 10px 40px;
            background: rgba(58, 80, 107, 0.3);
            border: 1px solid rgba(111, 255, 233, 0.3);
            border-radius: 24px;
            color: var(--text-light);
            outline: none;
            transition: all 0.3s ease;
        }
        
        .search:focus {
            border-color: var(--accent-teal);
            box-shadow: var(--glow);
        }
        
        .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--accent-teal);
        }
        
        .stats {
            display: flex;
            justify-content: space-between;
            padding: 15px 20px;
            background: rgba(58, 80, 107, 0.3);
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--accent-cyan);
        }
        
        .stat-label {
            font-size: 12px;
            color: var(--text-light);
            opacity: 0.8;
        }
        
        .main {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        
        .tree-container {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
        }
        
        .device-details {
            width: 250px;
            padding: 20px;
            background: rgba(11, 19, 43, 0.8);
            border-left: 1px solid rgba(111, 255, 233, 0.2);
            overflow-y: auto;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
        }
        
        .device-details.active {
            transform: translateX(0);
        }
        
        .tree-node {
            margin-bottom: 10px;
        }
        
        .tree-header {
            display: flex;
            align-items: center;
            padding: 10px;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s ease;
            background: rgba(58, 80, 107, 0.2);
        }
        
        .tree-header:hover {
            background: rgba(58, 80, 107, 0.4);
        }
        
        .tree-header.expanded {
            background: rgba(91, 192, 190, 0.2);
            margin-bottom: 5px;
        }
        
        .toggle-icon {
            margin-right: 10px;
            font-size: 18px;
            color: var(--accent-teal);
            transition: transform 0.3s ease;
        }
        
        .expanded .toggle-icon {
            transform: rotate(90deg);
        }
        
        .node-icon {
            margin-right: 10px;
            font-size: 18px;
            color: var(--accent-cyan);
        }
        
        .node-name {
            flex: 1;
            font-weight: 500;
        }
        
        .node-count {
            background: rgba(91, 192, 190, 0.2);
            color: var(--accent-cyan);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
        }
        
        .tree-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            padding-left: 30px;
        }
        
        .expanded + .tree-content {
            max-height: 500px;
        }
        
        .device-item {
            display: flex;
            align-items: center;
            padding: 8px 10px;
            margin: 5px 0;
            border-radius: 8px;
            cursor: pointer;
            background: rgba(58, 80, 107, 0.1);
            transition: all 0.2s ease;
        }
        
        .device-item:hover {
            background: rgba(58, 80, 107, 0.3);
        }
        
        .device-item.active {
            background: rgba(91, 192, 190, 0.3);
            border-left: 3px solid var(--accent-cyan);
        }
        
        .device-icon {
            color: var(--accent-teal);
            margin-right: 10px;
            font-size: 16px;
        }
        
        .device-name {
            flex: 1;
            font-size: 14px;
        }
        
        .device-status {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-left: 10px;
        }
        
        .status-online {
            background-color: #4CAF50;
            box-shadow: 0 0 5px #4CAF50;
        }
        
        .status-offline {
            background-color: #F44336;
        }
        
        .status-warning {
            background-color: #FFC107;
            box-shadow: 0 0 5px #FFC107;
        }
        
        .device-detail-header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(111, 255, 233, 0.2);
        }
        
        .device-detail-name {
            font-size: 18px;
            font-weight: 500;
            color: var(--accent-cyan);
            margin-bottom: 5px;
        }
        
        .device-detail-location {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .device-detail-status {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
        }
        
        .device-metrics {
            margin-top: 20px;
        }
        
        .metric {
            margin-bottom: 15px;
        }
        
        .metric-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 14px;
        }
        
        .metric-name {
            color: var(--text-light);
        }
        
        .metric-value {
            color: var(--accent-cyan);
            font-weight: 500;
        }
        
        .metric-bar {
            height: 6px;
            background: rgba(58, 80, 107, 0.5);
            border-radius: 3px;
            overflow: hidden;
        }
        
        .metric-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--accent-teal) 0%, var(--accent-cyan) 100%);
            border-radius: 3px;
            transition: width 0.3s ease;
        }
        
        .device-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        }
        
        .action-btn {
            background: rgba(58, 80, 107, 0.5);
            border: 1px solid rgba(111, 255, 233, 0.3);
            border-radius: 8px;
            padding: 8px 15px;
            color: var(--text-light);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .action-btn:hover {
            background: rgba(91, 192, 190, 0.3);
            border-color: var(--accent-cyan);
        }
        
        .action-btn.primary {
            background: rgba(91, 192, 190, 0.3);
            border-color: var(--accent-teal);
        }
        
        .action-btn.primary:hover {
            background: rgba(91, 192, 190, 0.5);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(58, 80, 107, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
            background: rgba(91, 192, 190, 0.5);
            border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(111, 255, 233, 0.5);
        }
        
        /* Responsive design */
        @media (max-width: 700px) {
            .container {
                border-radius: 0;
                height: 100%;
            }
            
            .header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .search-container {
                width: 100%;
                margin-top: 10px;
            }
            
            .stats {
                overflow-x: auto;
            }
            
            .device-details {
                position: absolute;
                top: 0;
                right: 0;
                height: 100%;
                width: 100%;
                max-width: 100%;
                z-index: 10;
            }
            
            .device-details.active {
                transform: translateX(0);
            }
        }
        
        /* Pulse animation for active devices */
        @keyframes pulse {
            0% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.05);
                opacity: 0.8;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
        
        /* Floating notification */
        .notification {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(91, 192, 190, 0.8);
            color: var(--text-dark);
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: var(--shadow);
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .close-details {
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            color: var(--accent-teal);
            cursor: pointer;
            font-size: 18px;
            display: none;
        }
        
        @media (max-width: 700px) {
            .close-details {
                display: block;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NexusHub IoT Control Center</h1>
            <div class="search-container">
                <span class="search-icon">🔍</span>
                <input type="text" class="search" placeholder="Search devices..." id="search-input">
            </div>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">42</div>
                <div class="stat-label">TOTAL DEVICES</div>
            </div>
            <div class="stat">
                <div class="stat-value">38</div>
                <div class="stat-label">ONLINE</div>
            </div>
            <div class="stat">
                <div class="stat-value">3</div>
                <div class="stat-label">WARNINGS</div>
            </div>
            <div class="stat">
                <div class="stat-value">1</div>
                <div class="stat-label">OFFLINE</div>
            </div>
        </div>
        
        <div class="main">
            <div class="tree-container" id="tree-container">
                <!-- Tree content will be populated by JavaScript -->
            </div>
            
            <div class="device-details" id="device-details">
                <button class="close-details" id="close-details">✖</button>
                <div class="device-detail-header">
                    <div class="device-detail-name">Select a Device</div>
                    <div class="device-detail-location">No device selected</div>
                    <div class="device-detail-status">
                        <div class="status-indicator"></div>
                        <span>Status: Unknown</span>
                    </div>
                </div>
                
                <div class="device-metrics">
                    <div class="metric">
                        <div class="metric-header">
                            <span class="metric-name">CPU Usage</span>
                            <span class="metric-value">0%</span>
                        </div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <div class="metric">
                        <div class="metric-header">
                            <span class="metric-name">Memory</span>
                            <span class="metric-value">0 MB</span>
                        </div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <div class="metric">
                        <div class="metric-header">
                            <span class="metric-name">Temperature</span>
                            <span class="metric-value">0°C</span>
                        </div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <div class="metric">
                        <div class="metric-header">
                            <span class="metric-name">Battery</span>
                            <span class="metric-value">0%</span>
                        </div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="device-actions">
                    <button class="action-btn">Restart</button>
                    <button class="action-btn primary">Configure</button>
                </div>
            </div>
        </div>
    </div>
    
    <div class="notification" id="notification">Device status updated</div>
    
    <script>
        // IoT device data with realistic types and locations
        const iotDevices = {
            "Living Areas": {
                "Living Room": [
                    { id: 1, name: "Smart TV", type: "entertainment", status: "online", metrics: { cpu: 32, memory: 512, temp: 38, battery: 'N/A' } },
                    { id: 2, name: "Ambient Lighting", type: "lighting", status: "online", metrics: { cpu: 12, memory: 64, temp: 29, battery: 'N/A' } },
                    { id: 3, name: "Air Purifier", type: "climate", status: "warning", metrics: { cpu: 45, memory: 128, temp: 42, battery: 'N/A' } },
                    { id: 4, name: "Motion Sensor", type: "security", status: "online", metrics: { cpu: 5, memory: 32, temp: 25, battery: 82 } }
                ],
                "Kitchen": [
                    { id: 5, name: "Smart Refrigerator", type: "appliance", status: "online", metrics: { cpu: 28, memory: 256, temp: 32, battery: 'N/A' } },
                    { id: 6, name: "Coffee Maker", type: "appliance", status: "online", metrics: { cpu: 15, memory: 128, temp: 55, battery: 'N/A' } },
                    { id: 7, name: "Smoke Detector", type: "safety", status: "online", metrics: { cpu: 8, memory: 64, temp: 29, battery: 95 } }
                ],
                "Dining Room": [
                    { id: 8, name: "Chandelier Control", type: "lighting", status: "online", metrics: { cpu: 10, memory: 64, temp: 30, battery: 'N/A' } },
                    { id: 9, name: "Ambient Speaker", type: "entertainment", status: "online", metrics: { cpu: 25, memory: 128, temp: 35, battery: 'N/A' } }
                ]
            },
            "Bedrooms": {
                "Master Bedroom": [
                    { id: 10, name: "Smart Blinds", type: "automation", status: "online", metrics: { cpu: 12, memory: 64, temp: 28, battery: 78 } },
                    { id: 11, name: "Sleep Tracker", type: "health", status: "online", metrics: { cpu: 22, memory: 128, temp: 31, battery: 65 } },
                    { id: 12, name: "Ambient Noise Machine", type: "comfort", status: "online", metrics: { cpu: 18, memory: 96, temp: 33, battery: 'N/A' } }
                ],
                "Guest Bedroom": [
                    { id: 13, name: "Smart Lamp", type: "lighting", status: "online", metrics: { cpu: 8, memory: 32, temp: 27, battery: 'N/A' } },
                    { id: 14, name: "Temperature Sensor", type: "climate", status: "warning", metrics: { cpu: 6, memory: 32, temp: 48, battery: 45 } }
                ],
                "Kid's Room": [
                    { id: 15, name: "Night Light", type: "lighting", status: "online", metrics: { cpu: 5, memory: 16, temp: 25, battery: 'N/A' } },
                    { id: 16, name: "Baby Monitor", type: "security", status: "online", metrics: { cpu: 35, memory: 256, temp: 38, battery: 87 } }
                ]
            },
            "Utility Areas": {
                "Garage": [
                    { id: 17, name: "Door Opener", type: "automation", status: "online", metrics: { cpu: 15, memory: 64, temp: 32, battery: 'N/A' } },
                    { id: 18, name: "EV Charger", type: "energy", status: "online", metrics: { cpu: 30, memory: 128, temp: 40, battery: 'N/A' } },
                    { id: 19, name: "Security Camera", type: "security", status: "offline", metrics: { cpu: 0, memory: 0, temp: 0, battery: 0 } }
                ],
                "Basement": [
                    { id: 20, name: "Water Leak Sensor", type: "safety", status: "online", metrics: { cpu: 4, memory: 16, temp: 22, battery: 92 } },
                    { id: 21, name: "Dehumidifier", type: "climate", status: "online", metrics: { cpu: 25, memory: 128, temp: 35, battery: 'N/A' } }
                ],
                "Laundry Room": [
                    { id: 22, name: "Smart Washer", type: "appliance", status: "online", metrics: { cpu: 28, memory: 256, temp: 38, battery: 'N/A' } },
                    { id: 23, name: "Smart Dryer", type: "appliance", status: "warning", metrics: { cpu: 65, memory: 256, temp: 62, battery: 'N/A' } }
                ]
            },
            "Outdoor": {
                "Front Yard": [
                    { id: 24, name: "Doorbell Camera", type: "security", status: "online", metrics: { cpu: 38, memory: 256, temp: 32, battery: 78 } },
                    { id: 25, name: "Landscape Lighting", type: "lighting", status: "online", metrics: { cpu: 10, memory: 64, temp: 28, battery: 'N/A' } }
                ],
                "Backyard": [
                    { id: 26, name: "Weather Station", type: "environmental", status: "online", metrics: { cpu: 22, memory: 128, temp: 30, battery: 85 } },
                    { id: 27, name: "Irrigation Controller", type: "automation", status: "online", metrics: { cpu: 18, memory: 96, temp: 31, battery: 'N/A' } },
                    { id: 28, name: "Pool Monitor", type: "environmental", status: "online", metrics: { cpu: 25, memory: 128, temp: 33, battery: 90 } }
                ]
            }
        };

        // Icons for different types of devices
        const typeIcons = {
            'entertainment': '🎮',
            'lighting': '💡',
            'climate': '🌡️',
            'security': '🔒',
            'appliance': '🔌',
            'safety': '⚠️',
            'automation': '⚙️',
            'health': '❤️',
            'comfort': '🛋️',
            'energy': '⚡',
            'environmental': '🌱'
        };

        // Location icons
        const locationIcons = {
            'Living Areas': '🏠',
            'Bedrooms': '🛌',
            'Utility Areas': '🔧',
            'Outdoor': '🌳'
        };

        // DOM elements
        const treeContainer = document.getElementById('tree-container');
        const deviceDetails = document.getElementById('device-details');
        const searchInput = document.getElementById('search-input');
        const notification = document.getElementById('notification');
        const closeDetailsBtn = document.getElementById('close-details');

        // Build the tree structure
        function buildTree() {
            treeContainer.innerHTML = '';
            
            for (const [category, locations] of Object.entries(iotDevices)) {
                const categoryNode = document.createElement('div');
                categoryNode.className = 'tree-node';
                
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'tree-header';
                categoryHeader.innerHTML = `
                    <span class="toggle-icon">▶</span>
                    <span class="node-icon">${locationIcons[category]}</span>
                    <span class="node-name">${category}</span>
                    <span class="node-count">${countDevicesInCategory(locations)}</span>
                `;
                
                const categoryContent = document.createElement('div');
                categoryContent.className = 'tree-content';
                
                for (const [location, devices] of Object.entries(locations)) {
                    const locationNode = document.createElement('div');
                    locationNode.className = 'tree-node';
                    
                    const locationHeader = document.createElement('div');
                    locationHeader.className = 'tree-header';
                    locationHeader.innerHTML = `
                        <span class="toggle-icon">▶</span>
                        <span class="node-icon">📍</span>
                        <span class="node-name">${location}</span>
                        <span class="node-count">${devices.length}</span>
                    `;
                    
                    const locationContent = document.createElement('div');
                    locationContent.className = 'tree-content';
                    
                    for (const device of devices) {
                        const deviceItem = document.createElement('div');
                        deviceItem.className = `device-item ${device.status === 'warning' ? 'pulse' : ''}`;
                        deviceItem.dataset.id = device.id;
                        deviceItem.innerHTML = `
                            <span class="device-icon">${typeIcons[device.type] || '📱'}</span>
                            <span class="device-name">${device.name}</span>
                            <span class="device-status status-${device.status}"></span>
                        `;
                        
                        deviceItem.addEventListener('click', () => showDeviceDetails(device, category, location));
                        
                        locationContent.appendChild(deviceItem);
                    }
                    
                    locationNode.appendChild(locationHeader);
                    locationNode.appendChild(locationContent);
                    categoryContent.appendChild(locationNode);
                    
                    // Event listener for location header
                    locationHeader.addEventListener('click', function() {
                        this.classList.toggle('expanded');
                    });
                }
                
                categoryNode.appendChild(categoryHeader);
                categoryNode.appendChild(categoryContent);
                treeContainer.appendChild(categoryNode);
                
                // Event listener for category header
                categoryHeader.addEventListener('click', function() {
                    this.classList.toggle('expanded');
                });
            }
        }
        
        // Count devices in a category
        function countDevicesInCategory(locations) {
            let count = 0;
            for (const devices of Object.values(locations)) {
                count += devices.length;
            }
            return count;
        }
        
        // Show device details
        function showDeviceDetails(device, category, location) {
            // Deactivate any previously active device
            const activeDevice = document.querySelector('.device-item.active');
            if (activeDevice) {
                activeDevice.classList.remove('active');
            }
            
            // Activate the selected device
            const deviceItem = document.querySelector(`.device-item[data-id="${device.id}"]`);
            if (deviceItem) {
                deviceItem.classList.add('active');
            }
            
            // Update details panel
            let statusClass = '';
            let statusText = '';
            
            switch(device.status) {
                case 'online':
                    statusClass = 'status-online';
                    statusText = 'Online';
                    break;
                case 'offline':
                    statusClass = 'status-offline';
                    statusText = 'Offline';
                    break;
                case 'warning':
                    statusClass = 'status-warning';
                    statusText = 'Warning';
                    break;
            }
            
            deviceDetails.querySelector('.device-detail-name').textContent = device.name;
            deviceDetails.querySelector('.device-detail-location').textContent = `${category} > ${location}`;
            
            const statusIndicator = deviceDetails.querySelector('.status-indicator');
            statusIndicator.className = 'status-indicator ' + statusClass;
            deviceDetails.querySelector('.device-detail-status span').textContent = `Status: ${statusText}`;
            
            // Update metrics
            updateMetric('CPU Usage', device.metrics.cpu + '%', device.metrics.cpu);
            updateMetric('Memory', device.metrics.memory + ' MB', device.metrics.memory / 10);
            updateMetric('Temperature', device.metrics.temp + '°C', (device.metrics.temp / 100) * 100);
            
            if (device.metrics.battery === 'N/A') {
                updateMetric('Battery', 'N/A', 0);
            } else {
                updateMetric('Battery', device.metrics.battery + '%', device.metrics.battery);
            }
            
            // Show details panel
            deviceDetails.classList.add('active');
        }
        
        // Update a metric in the details panel
        function updateMetric(name, value, percentage) {
            const metrics = deviceDetails.querySelectorAll('.metric');
            
            for (const metric of metrics) {
                const metricName = metric.querySelector('.metric-name').textContent;
                if (metricName === name) {
                    metric.querySelector('.metric-value').textContent = value;
                    metric.querySelector('.metric-fill').style.width = `${percentage}%`;
                }
            }
        }
        
        // Search functionality
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterDevices(searchTerm);
        });
        
        function filterDevices(searchTerm) {
            const deviceItems = document.querySelectorAll('.device-item');
            let hasResults = false;
            
            deviceItems.forEach(item => {
                const deviceName = item.querySelector('.device-name').textContent.toLowerCase();
                const shouldShow = deviceName.includes(searchTerm);
                
                item.style.display = shouldShow ? 'flex' : 'none';
                
                if (shouldShow) {
                    hasResults = true;
                    // Make sure parent containers are expanded
                    let parent = item.parentElement;
                    while (parent && !parent.classList.contains('tree-container')) {
                        if (parent.classList.contains('tree-content')) {
                            const header = parent.previousElementSibling;
                            if (header && header.classList.contains('tree-header')) {
                                header.classList.add('expanded');
                            }
                        }
                        parent = parent.parentElement;
                    }
                }
            });
            
            if (!hasResults && searchTerm) {
                showNotification('No devices found matching your search');
            }
        }
        
        // Close details panel (mobile)
        closeDetailsBtn.addEventListener('click', function() {
            deviceDetails.classList.remove('active');
            const activeDevice = document.querySelector('.device-item.active');
            if (activeDevice) {
                activeDevice.classList.remove('active');
            }
        });
        
        // Show notification
        function showNotification(message) {
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        // Initialize the tree
        buildTree();
        
        // Simulate device status changes
        setInterval(() => {
            const devices = Object.values(iotDevices).flatMap(locations => 
                Object.values(locations).flatMap(devices => devices)
            );
            
            const randomDevice = devices[Math.floor(Math.random() * devices.length)];
            const statuses = ['online', 'warning', 'offline'];
            const prevStatus = randomDevice.status;
            const newStatus = statuses[Math.floor(Math.random() * 3)];
            
            if (prevStatus !== newStatus && Math.random() > 0.7) {
                randomDevice.status = newStatus;
                
                // Update in the tree
                const deviceItem = document.querySelector(`.device-item[data-id="${randomDevice.id}"]`);
                if (deviceItem) {
                    const statusIndicator = deviceItem.querySelector('.device-status');
                    statusIndicator.className = `device-status status-${newStatus}`;
                    
                    if (newStatus === 'warning') {
                        deviceItem.classList.add('pulse');
                    } else {
                        deviceItem.classList.remove('pulse');
                    }
                    
                    // Update in details panel if this device is selected
                    if (deviceItem.classList.contains('active')) {
                        const statusIndicator = deviceDetails.querySelector('.status-indicator');
                        statusIndicator.className = `status-indicator status-${newStatus}`;
                        
                        let statusText = '';
                        switch(newStatus) {
                            case 'online': statusText = 'Online'; break;
                            case 'offline': statusText = 'Offline'; break;
                            case 'warning': statusText = 'Warning'; break;
                        }
                        
                        deviceDetails.querySelector('.device-detail-status span').textContent = `Status: ${statusText}`;
                    }
                    
                    showNotification(`${randomDevice.name} status changed to ${newStatus}`);
                }
            }
            
            // Randomize metrics for online devices
            if (randomDevice.status !== 'offline') {
                const variation = Math.floor(Math.random() * 11) - 5; // -5 to +5
                
                randomDevice.metrics.cpu = Math.max(5, Math.min(95, randomDevice.metrics.cpu + variation));
                randomDevice.metrics.temp = Math.max(20, Math.min(70, randomDevice.metrics.temp + (variation / 2)));
                
                if (randomDevice.metrics.battery !== 'N/A') {
                    randomDevice.metrics.battery = Math.max(0, Math.min(100, randomDevice.metrics.battery - Math.random()));
                }
                
                // Update metrics if device is selected
                const deviceItem = document.querySelector(`.device-item[data-id="${randomDevice.id}"]`);
                if (deviceItem && deviceItem.classList.contains('active')) {
                    updateMetric('CPU Usage', randomDevice.metrics.cpu + '%', randomDevice.metrics.cpu);
                    updateMetric('Temperature', randomDevice.metrics.temp + '°C', (randomDevice.metrics.temp / 100) * 100);
                    
                    if (randomDevice.metrics.battery !== 'N/A') {
                        updateMetric('Battery', Math.floor(randomDevice.metrics.battery) + '%', randomDevice.metrics.battery);
                    }
                }
            }
        }, 5000);
    </script>
</body>
</html>
