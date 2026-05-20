
# Hein Htet San - Business Management System

This application is designed to help you manage your Finance, Mobile Sales, Repair Services, and Installment Plans.

## 💻 How to Run on Your Laptop

### 1. Initial Setup (Requires Internet Once)
Before you go offline, you must download the tools and libraries:
1. **Install Node.js**: Go to [https://nodejs.org/](https://nodejs.org/) and download the "LTS" version.
2. **Rename Folder**: Ensure your project folder name **DOES NOT** have symbols like `&` or spaces. 
   * Bad name: `My App & Business`
   * Good name: `hhs-app` or `my-business`
3. **Open Terminal**: Open "Command Prompt" (Windows) or "Terminal" (Mac).
4. **Go to Folder**: Use the `cd` command to enter your project folder.
5. **Install Libraries**: Type the following and press Enter (Requires Internet):
   ```bash
   npm install
   ```

### 2. Running the App (No Internet Needed)
After the setup above is finished, you can run the app anytime without internet:
1. Open your terminal in the project folder.
2. Type:
   ```bash
   npm run dev
   ```
3. Open your web browser and go to: `http://localhost:5173`

## ❌ Troubleshooting "'-finance' is not recognized"
If you see an error like `'-finance' is not recognized` or `MODULE_NOT_FOUND`:
1. It means your folder name has a `&` symbol. **Rename the folder** to remove the `&`.
2. Delete the `node_modules` folder if it exists.
3. Run `npm install` again.

## ⚠️ Internet & AI
* **Offline Features**: Adding transactions, managing stock, repair tickets, and installment calculations work **OFFLINE**. All data is saved on your laptop.
* **Online Features**: The **AI Chat Assistant** requires internet to talk to Google's servers.

## 🔐 Security
* **Admin Username**: `admin`
* **Password**: `1471656` (Used for logins and sensitive actions like deleting records).

## 💾 Data Backup
Use the **Data Backup** section in each dashboard regularly. It downloads a file to your laptop. If you ever clear your browser history or change laptops, you can use that file to **Restore** all your business data.
