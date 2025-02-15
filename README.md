# Motion-Sensor App  

A simple motion-sensor web application that generates sound based on device motion using the Web Audio API. The app allows users to **enable motion tracking**, **play generated sounds**, and **modify sound filters** in real time.

---

## 📌 Features  

✔️ **Device Motion Control**: Uses motion sensors (accelerometer/gyroscope) to modify sound properties.  
✔️ **White & Pink Noise**: Select between white noise and pink noise generation.  
✔️ **Live Audio Processing**: Implements bandpass filters and a reverb effect.  
✔️ **Oscillator-Based Sound**: Generates tones based on user motion.  
✔️ **Mobile-Friendly**: Works best on mobile devices with motion sensors.  

---

## 🚀 Getting Started  

### 1️⃣ **Clone the Repository**  
```sh
git clone https://github.com/yourusername/motion-sensor-app.git
cd motion-sensor-app
```

### 2️⃣ **Install VS Code Live Server Extension**  
- Open **VS Code**
- Install the **Live Server** extension by **Ritwick Dey**  
- Restart VS Code after installation  

### 3️⃣ **Enable HTTPS for Live Server (Required for Motion Sensors on iOS)**  
Since iOS requires **HTTPS** for motion sensor access, follow these steps to enable HTTPS:

#### 🔹 **Generate an SSL Certificate (Skip if you already have one)**
- Open PowerShell (Windows) or Terminal (Mac/Linux)  
- Run:
  ```sh
  openssl req -new -newkey rsa:2048 -x509 -sha256 -days 365 -nodes -out localhost.crt -keyout localhost.key
  ```
- This will create `localhost.crt` and `localhost.key` files  

#### 🔹 **Move Certificates to a Secure Location**  
- Place them in:  
  ```
  C:/Users/your-username/localhost.crt  
  C:/Users/your-username/localhost.key  
  ```

#### 🔹 **Update VS Code User Settings**  
- Open **VS Code**  
- Go to **File > Preferences > Settings**  
- Click **Open Settings (JSON)**  
- Add the following entry:
  ```json
  "liveServer.settings.https": {
      "enable": true,
      "cert": "C:/Users/your-username/localhost.crt",
      "key": "C:/Users/your-username/localhost.key"
  }
  ```

### 4️⃣ **Start the Live Server**  
- Right-click **index.html** → Click **"Open with Live Server"**  
- Open in your browser:  
  ```
  https://127.0.0.1:5500
  ```

---

## 📱 Accessing the App from a Mobile Device  

To test the **motion sensor functionality** on your mobile phone, follow these steps:

### **Find Your Local IP Address (Windows & Mac)**  
1. **Windows**:
   - Open **Command Prompt** and run:  
     ```sh
     ipconfig
     ```
   - Look for the **IPv4 Address** (e.g., `192.168.1.100`).  

2. **Mac**:
   - Open **Terminal** and run:  
     ```sh
     ifconfig | grep "inet "
     ```
   - Find the IPv4 address of your local network (e.g., `192.168.1.100`).  

### **Connect Your Mobile Device**  
1. Ensure your **computer and phone are on the same Wi-Fi network**.  
2. Open **Live Server** in VS Code.  
3. On your mobile browser (Safari/Chrome), visit:  
   ```
   https://YOUR_LOCAL_IP:5500
   ```
   Example:
   ```
   https://192.168.1.100:5500
   ```
4. Accept the **SSL warning** (since it's a self-signed certificate).  
5. The app should now work on your mobile phone.  

---

## 📱 How to Use the App  

1️⃣ **Click "Enable Motion Sensors"**  
   - If using **iOS Safari**, you must allow access after clicking.  

2️⃣ **Click "Start Sound"**  
   - Motion tracking will influence the sound filters.  

3️⃣ **Move Your Device**  
   - Tilting your phone will adjust frequencies dynamically.  

4️⃣ **Select Noise Type**  
   - Choose between **White Noise** and **Pink Noise** from the dropdown.  

---

## 🛠️ Technologies Used  

- **HTML** → Page structure  
- **CSS** → Styling  
- **JavaScript** → Logic and interactivity  
  - Web Audio API → Sound processing  
  - Device Motion API → Motion tracking  

---

## 📜 License  

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 💡 Notes  

- Motion sensors may not work in **desktop browsers** (Best on mobile).  
- iOS requires **HTTPS** for motion sensor access.  
- If `Live Server` does not start in HTTPS mode, manually open:  
  ```
  https://127.0.0.1:5500
  ```
- If accessing from mobile, make sure to use your **local IP address** instead of `127.0.0.1`.  

---

## 👨‍💻 Author  

Developed by Julie Grimala  
🔗 https://github.com/jgrimala 
