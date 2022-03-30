let db;

// create or open db
const request = indexedDB.open('travel-buddy', 1);

// emit when created or if version changes
request.onupgradeneeded = function(e) {
  const db = e.target.result;
  db.createObjectStore('new_transaction', { autoIncrement: true });
}

request.onsuccess = function(e) {
  db = e.target.result;

  if (navigator.onLine) {
    uploadTransaction();
  }
}

request.onerror = function(e) {
  console.log(e.target.errorCode);
}

// executed if no connection
function saveRecord(record) {
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const transactionObjectStore = transaction.objectStore('new_transaction');
  transactionObjectStore.add(record);
}

function uploadTransaction(){
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  const transactionObjectStore = transaction.objectStore('new_transaction');

  const getAll = transactionObjectStore.getAll();

  getAll.onsuccess = function() {
    // if data in store
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          const transactionObjectStore = transaction.objectStore('new_transaction');
          transactionObjectStore.clear();

          alert('All saved transactions have been submitted');
        })
        .catch(err => {
          console.log(err);
        })
    }
  }
};

window.addEventListener('online', uploadTransaction);