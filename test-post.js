const url = 'https://script.google.com/macros/s/AKfycbxA_dAAUd_loaH7Q2DH4nIliskEt7Kw_a0bHBCP5kHqSvZDr9gFTQDCd7FF3gvAb5oCWA/exec';
const payload = {
  action: 'overwrite',
  sheet: 'warga',
  data: [{"id":"1714000000000","nik":"1234567890123456","nama":"Budi","jenisKelamin":"Laki-laki","agama":"Islam","blok":"A-01","status":"Kepala Keluarga"}]
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify(payload)
})
.then(res => res.text())
.then(text => console.log('Response:', text))
.catch(err => console.error('Error:', err));
