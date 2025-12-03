# Telegram Sender Pro 🚀

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.x-blue.svg)
![Flask](https://img.shields.io/badge/flask-2.x-green.svg)

A premium, web-based tool to broadcast messages to multiple Telegram users simultaneously using a Bot. Built with Python (Flask) and a modern, glassmorphism-inspired frontend.

## ✨ Features

- **Bulk Messaging**: Send messages to multiple users at once.
- **Premium UI**: Beautiful, dark-themed glassmorphism design.
- **Real-time Status**: Live feedback on successful and failed deliveries.
- **Data Persistence**: Automatically saves your Bot Token, User IDs, and Message to your browser's local storage, so you never lose your setup.
- **Responsive**: Works seamlessly on desktop and mobile devices.
- **JSON Input**: Easy-to-manage user lists using standard JSON format.

## 🛠️ Prerequisites

- **Python 3.x** installed on your machine.
- A **Telegram Bot Token**. You can get one for free from [@BotFather](https://t.me/BotFather).
- A list of **Chat IDs** for the users you want to message.

## 🚀 Installation

1.  **Clone the repository**
    ```bash
    git clone
    cd tele-msg
    ```

2.  **Install Dependencies**
    It is recommended to use a virtual environment.
    ```bash
    pip install -r requirements.txt
    ```

## 💻 Usage

1.  **Start the Application**
    ```bash
    python app.py
    ```

2.  **Open in Browser**
    Navigate to `http://127.0.0.1:5000` in your web browser.

3.  **Configure & Send**
    - **Bot Token**: Paste your token from BotFather (e.g., `123456:ABC-def...`).
    - **User IDs**: Enter the recipient Chat IDs in a JSON array format:
      ```json
      [
        123456789,
        987654321
      ]
      ```
    - **Message**: Type your broadcast message.
    - Click **Send**.

## 🤝 Contributing

Contributions are welcome! This project is open source and we love community involvement.

1.  **Fork** the repository.
2.  Create a new **Branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** to the branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

Please ensure your code follows the existing style and includes relevant tests (if applicable).

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Disclaimer**: This tool is for educational and legitimate use cases (e.g., notifying your bot subscribers). Spamming users is a violation of Telegram's Terms of Service. Use responsibly.
