---
title: "Graylog + LibreNMS 整合指南"
description: "Graylog 和 LibreNMS 與 Arova Nexus 的整合設定"
---


> **版本：** v1.0 ｜ **更新日期：** 2026-03-26 ｜ **適用角色：** IT 管理員

本指南說明如何將雙鴻科技現有的 Graylog 和 LibreNMS 監控系統與 Arova Nexus 整合，讓監控警報自動建立 Incident，實現從警報到事件處理的全自動流程。

---

## 整合架構概覽

整合完成後，Graylog 和 LibreNMS 的警報會透過 Webhook 自動送到 Arova Nexus，系統在 10 秒內自動建立 Incident，並依嚴重度分派給對應的 IT 維運人員。

<img src="/diagrams/integration-architecture.svg" alt="雙鴻科技監控整合架構圖" style="max-width:100%; margin:1em 0;" />

---

## 前置條件

在開始設定之前，請確認以下條件：

- Arova Nexus 已安裝並啟用 **Incident Management** 和 **Integration Platform** 模組
- 你有 Arova Nexus 的 **IT 管理員** 角色
- 你有 Graylog 的管理員權限
- 你有 LibreNMS 的管理員權限
- Graylog / LibreNMS 伺服器可以透過網路存取 Arova Nexus 的 API 端點

---

## Step 1：在 Nexus 建立 API Key

在設定 Graylog 和 LibreNMS 之前，你需要先在 Nexus 建立一組 API Key，供 Webhook 認證使用。

1. 登入 Arova Nexus，點選左側選單的**設定**
2. 進入 **API Key 管理**
3. 點選**建立 API Key**
4. 填寫以下資訊：
   - **名稱：** `Monitoring-Webhook`（或你偏好的名稱）
   - **權限範圍：** 勾選 **Incident Management**
5. 點選**建立**
6. 複製畫面上顯示的 API Key

> ⚠️ **注意：** API Key 只會顯示一次，請立即複製並妥善保存。如果遺失，需要重新建立。

---

## Step 2：設定 Graylog Webhook

### 2.1 建立 HTTP Notification

1. 登入 Graylog 管理介面
2. 進入 **Alerts** → **Notifications**
3. 點選 **Create Notification**

### 2.2 選擇 Notification 類型

1. 在 **Notification Type** 選擇 **HTTP Notification**
2. 填寫 **Title**，例如：`Arova Nexus Incident`

### 2.3 設定 Webhook URL 和 API Key

1. 在 **URL** 欄位填入 Nexus 的 Incident Webhook 端點：
   ```
   https://<你的-nexus-domain>/api/v1/incidents/webhook/generic
   ```
2. 在 **HTTP Headers** 加入 API Key 認證標頭：
   ```
   X-API-Key: <你在 Step 1 建立的 API Key>
   Content-Type: application/json
   ```

### 2.4 設定觸發條件

1. 回到 **Alerts** → **Event Definitions**
2. 選擇你要送到 Nexus 的警報規則（或建立新的規則）
3. 在每條規則的 **Notifications** 區段，加入剛才建立的 `Arova Nexus Incident` Notification
4. 建議先選擇幾條重要的警報規則測試，確認正常後再批次啟用

> 💡 **提示：** 建議依嚴重度分組。將 Emergency 和 Alert 等級的規則指向高優先的 Notification，方便後續在 Nexus 做 Payload Mapping 時區分嚴重度。

### 2.5 測試 Notification

1. 在剛建立的 Notification 設定頁面，點選 **Test**
2. Graylog 會送出一筆測試訊息到 Nexus
3. 到 Nexus 的 **事件管理** 頁面，確認是否收到測試 Incident

---

## Step 3：設定 LibreNMS Webhook

### 3.1 建立 Alert Transport

1. 登入 LibreNMS 管理介面
2. 進入 **Alerts** → **Alert Transports**
3. 點選 **Create Alert Transport**

### 3.2 設定 API Transport

1. **Transport Type** 選擇 **API**
2. **Transport Name** 填寫 `Arova Nexus`
3. **API URL** 填入 Nexus 的 Incident Webhook 端點：
   ```
   https://<你的-nexus-domain>/api/v1/incidents/webhook/generic
   ```
4. **API Method** 選擇 **POST**
5. 在 **Headers** 區段加入：
   ```
   X-API-Key: <你在 Step 1 建立的 API Key>
   Content-Type: application/json
   ```

### 3.3 關聯 Alert Rules

1. 進入 **Alerts** → **Alert Rules**
2. 選擇你要送到 Nexus 的警報規則
3. 在規則的 **Transports** 區段，勾選 `Arova Nexus`
4. 對需要的規則重複此操作

> 💡 **提示：** LibreNMS 的警報狀態（`alert_state`）會在 Payload 中送出，可在 Nexus 的 Payload Mapping 中用來判斷嚴重度。

### 3.4 測試 Transport

1. 在 Alert Transports 頁面，找到 `Arova Nexus` transport
2. 點選 **Test Transport**
3. 到 Nexus 的**事件管理**頁面，確認是否收到測試 Incident

---

## Step 4：設定 Nexus Payload Mapping

Graylog 和 LibreNMS 送出的 JSON 格式不同，你需要在 Nexus 中設定 Payload Mapping，將外部欄位對應到 Nexus 的 Incident 欄位。

### 4.1 進入 Payload Mapping 設定

1. 在 Nexus 點選左側選單的**設定**
2. 進入 **整合管理** → **Monitoring Payload Mapping**

### 4.2 建立 Graylog Mapping

1. 點選**新增 Mapping**
2. **Mapping 名稱** 填寫 `Graylog`
3. 設定欄位對應：

| Graylog 來源欄位 | Nexus Incident 欄位 | 說明 |
|-----------------|--------------------|----|
| `event_definition_title` | **標題**（title） | 警報名稱 |
| `priority` | **嚴重度**（severity） | 需搭配嚴重度對照表 |
| `source` | **來源**（source） | 觸發警報的主機或服務 |
| `message` | **描述**（description） | 警報詳細訊息 |
| `timestamp` | **觸發時間**（triggered_at） | 警報發生時間 |

4. 在**嚴重度對照**區段，設定 Graylog Priority 到 Nexus 嚴重度的對應：

| Graylog Priority | Nexus 嚴重度 | 說明 |
|-----------------|------------|------|
| Emergency（0） | SEV1 — 重大 | 核心服務完全中斷 |
| Alert（1） | SEV1 — 重大 | 需要立即處理 |
| Critical（2） | SEV2 — 高 | 核心服務部分異常 |
| Error（3） | SEV3 — 中 | 非核心服務異常 |
| Warning（4） | SEV4 — 低 | 輕微異常，不影響使用 |
| Notice（5） | SEV4 — 低 | 一般通知 |
| Informational（6） | *不建立 Incident* | 可在觸發條件中過濾 |
| Debug（7） | *不建立 Incident* | 可在觸發條件中過濾 |

5. 點選**儲存**

### 4.3 建立 LibreNMS Mapping

1. 點選**新增 Mapping**
2. **Mapping 名稱** 填寫 `LibreNMS`
3. 設定欄位對應：

| LibreNMS 來源欄位 | Nexus Incident 欄位 | 說明 |
|-----------------|--------------------|----|
| `title` | **標題**（title） | 警報規則名稱 |
| `hostname` | **來源**（source） | 觸發警報的設備 |
| `severity` | **嚴重度**（severity） | 需搭配嚴重度對照表 |
| `rule` | **描述**（description） | 觸發的告警規則 |
| `timestamp` | **觸發時間**（triggered_at） | 警報發生時間 |
| `alert_state` | *自訂欄位* | 用於判斷是新警報還是恢復 |

4. 在**嚴重度對照**區段，設定 LibreNMS severity 到 Nexus 嚴重度的對應：

| LibreNMS Severity | Nexus 嚴重度 | 說明 |
|------------------|------------|------|
| critical | SEV1 — 重大 | 設備或服務完全中斷 |
| warning | SEV3 — 中 | 非核心服務異常 |
| ok | *關閉 Incident* | 設備恢復正常，自動解決對應 Incident |

5. 點選**儲存**

> 💡 **提示：** LibreNMS 的 `alert_state` 為 `1` 時代表新警報，為 `0` 時代表警報恢復。你可以利用此欄位設定條件，在警報恢復時自動將對應的 Incident 標記為已解決。

---

## Step 5：端對端測試

整合設定完成後，請依以下步驟進行端對端測試，確認從警報到 Incident 建立的完整流程。

### 5.1 測試 Graylog 整合

1. **觸發測試警報：** 在 Graylog 中手動觸發一條設定過 Arova Nexus Notification 的警報規則
2. **驗證 Incident 建立：** 在 10 秒內到 Nexus 的**事件管理**頁面，確認是否出現對應的新 Incident
3. **驗證嚴重度對應：** 確認 Incident 的嚴重度符合 Payload Mapping 中設定的對照表
4. **驗證通知發送：** 確認被指派的 IT 維運人員有收到通知（站內通知 / Email）
5. **驗證 AI 摘要：** 確認 Incident 建立後 30 秒內，AI 自動產生了初步分析摘要

### 5.2 測試 LibreNMS 整合

1. **觸發測試警報：** 在 LibreNMS 中手動觸發一條關聯了 `Arova Nexus` Transport 的警報規則
2. **驗證 Incident 建立：** 在 10 秒內到 Nexus 的**事件管理**頁面，確認是否出現對應的新 Incident
3. **驗證嚴重度對應：** 確認 Incident 的嚴重度符合 Payload Mapping 中設定的對照表
4. **驗證通知發送：** 確認被指派的 IT 維運人員有收到通知
5. **驗證 AI 摘要：** 確認 AI 分析摘要已自動產生

> ⚠️ **注意：** 測試完成後記得清理測試產生的 Incident（標記為誤報關閉），避免影響正式的事件統計。

---

## 問題排除

如果整合過程中遇到問題，請依照下表排查：

| 症狀 | 檢查項目 | 解決方法 |
|------|---------|---------|
| 警報沒有送到 Nexus | Webhook URL 是否正確、API Key 是否有效、防火牆是否允許 Graylog/LibreNMS 存取 Nexus | 確認 URL 格式正確（包含 `https://`），重新建立 API Key，開放防火牆規則 |
| Incident 嚴重度不正確 | Payload Mapping 的嚴重度對照表設定 | 到 **設定** → **整合管理** → **Monitoring Payload Mapping** 檢查並修正對照規則 |
| 連線逾時（Timeout） | 網路連線是否通暢、Nexus 服務是否正常運作 | 從 Graylog/LibreNMS 伺服器 ping Nexus 主機，確認 Nexus 服務狀態；到 **設定** → **系統健康** 檢查各服務狀態 |
| 認證失敗（401 / 403） | API Key 是否正確、是否已過期或被撤銷 | 到 **設定** → **API Key 管理** 確認 Key 狀態，必要時重新建立 |
| Incident 建立但沒有 AI 摘要 | AI 服務是否正常、AI 呼叫配額是否用盡 | 到 **設定** → **系統健康** 檢查 AI 引擎狀態；到 **設定** → **授權管理** 檢查本月 AI 呼叫用量 |
| 同一個警報重複建立 Incident | 警報合併設定是否正確 | 確認 Nexus 的警報合併功能已開啟（預設 5 分鐘內來源和類型相同的警報會自動合併） |

### 查看整合連線健康狀態

你可以隨時到 **設定** → **整合管理** 查看所有整合連線的健康狀態。每個連線會顯示：

- **連線狀態：** 已連線 / 未設定 / 錯誤
- **最後成功時間：** 最近一次成功接收 Webhook 的時間
- **錯誤訊息：** 如果連線異常，會顯示最近的錯誤訊息

如果連線中斷，系統會自動通知 IT 管理員。你也可以點選**錯誤日誌**查看歷史錯誤紀錄。

---

## 下一步

整合完成後，建議進行以下設定以充分利用 Nexus 的事件管理能力：

- **設定升級規則：** 到 **設定** → **事件管理** → **升級規則**，設定 SEV1/SEV2 事件在指定時間內未確認時自動升級通知
- **設定通知偏好：** 讓 IT 維運人員到 **個人設定** → **通知偏好** 調整接收通知的方式
- **建立處理流程：** 到 **自動化** 模組建立常見事件的自動化處理流程，例如自動重啟服務

如需進一步協助，請聯繫 Arova 技術團隊。
