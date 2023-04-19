
function main() {
  eth();
  bsc();
  op();
  arb();
  zks();
  starknet();
  Logger.log('更新完毕')

}

function eth() {
  var apiKey = "请替换你自己的apikey";
  var url = "https://api.etherscan.io/"
  getBalanceAndTxCountAndGas(url, apiKey, 0);
}
function bsc() {
  var apiKey = "请替换你自己的apikey";
  var url= "https://api.bscscan.com/"
  getBalanceAndTxCountAndGas(url, apiKey, 3);
}

function op() {
  var apiKey = "请替换你自己的apikey";
  var url= "https://api-optimistic.etherscan.io/"
  getBalanceAndTxCountAndGas(url, apiKey, 6);
}

function arb() {
  var apiKey = "请替换你自己的apikey";
  var url= "https://api.arbiscan.io/"
  getBalanceAndTxCountAndGas(url, apiKey, 9);
}

function zks() {
  getZkSyncBalance();
  getZkSyncGasAndTxCount();
}

function starknet() {
  getStarknetInfoFromViewblock();
}


function getStarknetTxAndBalanceFromViewblock(address) {
  const url = `https://api.viewblock.io/starknet/contracts/${address}?network=mainnet`;
  const headers = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh;q=0.9,ja;q=0.8,zh-TW;q=0.7,en;q=0.6",
    "Origin": "https://viewblock.io",
    "Referer": "https://viewblock.io/",
    "Sec-Ch-Ua": "\"Chromium\";v=\"112\", \"Google Chrome\";v=\"112\", \"Not:A-Brand\";v=\"99\"",
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": "\"Windows\"",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
  };
  const options = {
    "method": "GET",
    "headers": headers,
    "muteHttpExceptions": true
  };
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  const txCount = data.txs.total; // 获取交易次数

  const tokens = data.tokens;
  let ethBalance = 0;
  for (const address in tokens) {
    const token = tokens[address];
    if (token.symbol === "ETH") {
      ethBalance = token.balance / 10**18; // 转换成 ETH
    }
  }

  // 返回交易次数和 ETH 余额
  return {
    txCount: txCount,
    ethBalance: ethBalance
  };

}


function getStarknetInfoFromViewblock() {
  var sheet = getCurrentSheet();
  var startColumn = 3
  var maxValueInColumn = getMaxOfColumn(2)
  var range = sheet.getRange(startColumn,  20, maxValueInColumn, 3);
  range.clearContent();
  for (var i = startColumn; i <= maxValueInColumn; i++) {
    var address = sheet.getRange(i, 3).getValue();
    if (address == '') {
      continue
    }
    try {
      var txAndBalance = getStarknetTxAndBalanceFromViewblock(address);
    } catch (e) {
      txAndBalance = 0
      Logger.log('出错了, 地址:' + address)
    }
    sheet.getRange(i, 20).setValue(txAndBalance.ethBalance);
    sheet.getRange(i, 21).setValue(txAndBalance.txCount);
    Utilities.sleep(1000);
  }
}

function getEthBalanceFromZkScan(address) {
  const url = `https://zksync2-mainnet.zkscan.io/api?module=account&action=tokenlist&address=${address}`;
  const response = UrlFetchApp.fetch(url);
  const result = JSON.parse(response.getContentText());

  if (result.status !== "1") {
    throw new Error("Failed to fetch token list. Status code: " + result.status);
  }

  let ethBalance = null;

  const tokens = result.result;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.symbol === "ETH") {
      const balance = Number(token.balance) / (10 ** Number(token.decimals));
      ethBalance = balance;
      break;
    }
  }

  return ethBalance;
}


function getZkSyncBalance() {
  var sheet = getCurrentSheet();
  var startColumn = 3
  var maxValueInColumn = getMaxOfColumn(2)
  var range = sheet.getRange(startColumn,  17, maxValueInColumn, 3);
  range.clearContent();
  for (var i = startColumn; i <= maxValueInColumn; i++) {
    var address = sheet.getRange(i, 2).getValue();
    if (address == '') {
      continue
    }
    try {
      var ethBalance = getEthBalanceFromZkScan(address);
      if (isNaN(ethBalance)) {
        ethBalance = 0
      }
    } catch (e) {
      ethBalance = 0
      Logger.log('出错了, 地址:' + address)
    }
    sheet.getRange(i, 17).setValue(ethBalance);
    Utilities.sleep(1000);
  }
}
function getGasAndTxCountFromZkSync() {
  var sheet = getCurrentSheet();
  var startColumn = 3
  var maxValueInColumn = getMaxOfColumn(2)
  var range = sheet.getRange(startColumn,  19, maxValueInColumn, 2);
  range.clearContent();
  for (var i = startColumn; i <= maxValueInColumn; i++) {
    var address = sheet.getRange(i, 2).getValue();
    if (address == '') {
      continue
    }
    try {
      var url = "https://zksync2-mainnet-explorer.zksync.io/transactions?limit=5&direction=older&accountAddress="+address;
      var options = {
        'method': 'get',
        'contentType': 'application/json'
      };
      var response = UrlFetchApp.fetch(url, options);
      var json = JSON.parse(response.getContentText());
      var transaction_count = json.total;
    } catch (e) {
      ethBalance = 0
      Logger.log('出错了, 地址:' + address)
    }

    sheet.getRange(i, 18).setValue(transaction_count);

    Utilities.sleep(1000);
  }
}

function getZkSyncGasAndTxCount() {
  var sheet = getCurrentSheet();
  var startColumn = 3
  var maxValueInColumn = getMaxOfColumn(2)
  var range = sheet.getRange(startColumn,  18, maxValueInColumn, 2);
  range.clearContent();
  for (var i = startColumn; i <= maxValueInColumn; i++) {
    var address = sheet.getRange(i, 2).getValue();
    if (address == '') {
      continue
    }
    try {
      var url = "https://zksync2-mainnet.zkscan.io/address-counters?id="+address;
      var options = {
        'method': 'get',
        'contentType': 'application/json'
      };
      var response = UrlFetchApp.fetch(url, options);
      var json = JSON.parse(response.getContentText());
      var gas_usage_count = parseInt(json.gas_usage_count);
      var transaction_count = json.transaction_count;
    } catch (e) {
      ethBalance = 0
      Logger.log('出错了, 地址:' + address)
    }

    sheet.getRange(i, 18).setValue(transaction_count);
    sheet.getRange(i, 19).setValue(gas_usage_count);
    Utilities.sleep(1000);
  }
}



function getBalanceAndTxCountAndGas(bscURL, apiKey, offset) {
  var sheet = getCurrentSheet();
  var startColumn = 3
  var maxValueInColumn = 4
  var maxValueInColumn = getMaxOfColumn(2)
  // 清除值
  var range = sheet.getRange(startColumn,  5 + offset, maxValueInColumn, 3);
  range.clearContent();

  for (var i = startColumn; i <= maxValueInColumn; i++) {
    var address = sheet.getRange(i, 2).getValue();
    if (address == '') {
      continue
    }
    try {
      var url = bscURL +"api?module=account&action=balance&address="+address+"&tag=latest&apikey="+apiKey;
      var response = UrlFetchApp.fetch(url);
      var json = response.getContentText();
      var data = JSON.parse(json);
      var balance = parseInt(data.result)/1000000000000000000;
      
    } catch (e) {
      balance = 0
    }
    sheet.getRange(i, 5 + offset).setValue(balance);

    try {
      var url = bscURL +"api?module=account&action=txlist&address="+address+"&startblock=0&endblock=99999999&sort=asc&apikey="+apiKey;
      var response = UrlFetchApp.fetch(url);
      var json = response.getContentText();
      var data = JSON.parse(json);
      // Logger.log("address: %s data: %s ", address, data)
      var numTransactions = data.result.length;
      
    } catch (e) {
      numTransactions = 0
    }
    sheet.getRange(i, 6 + offset).setValue(numTransactions);


    try {
      var allTxUrl = bscURL +"api?module=account&action=txlist&address=" + address + "&startblock=0&endblock=99999999&sort=asc&apikey=" + apiKey;
      var allTxResponse = UrlFetchApp.fetch(allTxUrl);
      var allTxJson = JSON.parse(allTxResponse.getContentText());
      var totalGasUsed = 0.0;
      for (var j = 0; j < allTxJson.result.length; j++) {
        try {
          var txHash = allTxJson.result[j].hash;
          if (txHash == null) continue
          var gasPrice = parseInt(allTxJson.result[j].gasPrice).toFixed(0);
          var gasUsed = parseInt(allTxJson.result[j].gasUsed).toFixed(0);
          var product = gasPrice * gasUsed;

          var formattedProduct = Utilities.formatString("%d", product);
          var gas = parseInt(formattedProduct)/1000000000000000000
          // Logger.log("txHash: %s gasPrice: %s gasUsed: %s gas: %s", txHash, gasPrice, gasUsed, gas);

          if (isNaN(gas)) {
            continue
          }
        } catch (e) {
          gas = 0
          continue
        }

        totalGasUsed += gas;
        // Logger.log("txHash: %s gasUsed: %s totalGasUsed: %s", txHash, gasUsed, totalGasUsed);
        // Utilities.sleep(10000);
      }
    } catch (e) {
      totalGasUsed = 0
    }
    sheet.getRange(i, 7 + offset).setValue(totalGasUsed);
    Utilities.sleep(100);
  }
}

function getCurrentSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet(); //get active spreadsheet (bound to this script)
    return ss.getSheetByName('钱包管理+余额');
}

function getMaxOfColumn(columnNumber) {
  var sheet = getCurrentSheet();
  var range = sheet.getRange(1, columnNumber, sheet.getLastRow(), 1);
  var values = range.getValues();
  var max = values.length;
  return max;
}
