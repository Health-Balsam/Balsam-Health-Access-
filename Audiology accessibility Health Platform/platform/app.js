// بيانات افتراضية (يمكن تعديلها من لوحة التحكم)
const DEFAULT_DATA = {
  facilities: [
    { id: "balsam", name_ar: "مجمع بلسم الجنوب الطبي", name_en: "Balsam Al-Janoub Medical Complex",
      clinics: [
        "الطوارئ","الباطنية","الأسنان","النساء والولادة","العلاج الطبيعي","الجلدية","الأطفال","الأشعة","المختبر"
      ]
    }
  ],
  requests: [] // سيتم الحفظ في localStorage
};

const STORAGE_KEY = "signedmed_platform_v1";

// تحميل/حفظ البيانات
function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA)); return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
  try { return JSON.parse(raw); } catch(e) { localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA)); return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
}
function saveData(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

// i18n بسيط
let LANG = localStorage.getItem("platform_lang") || "ar";
const TXT = {
  ar: {
    kioskTitle: "جهاز الخدمة الذاتية",
    labelFacility: "اختر المنشأة الصحية",
    labelClinic: "اختر العيادة",
    labelName: "اسم المريض",
    labelId:"رقم الهوية / الإقامة",
    labelFile:"رقم الملف (إن وُجد)",
    submit:"تأكيد الحجز",
    print:"عرض/طباعة",
    confTitle:"تم إرسال الطلب",
    confText:"تم تسجيل طلبك. سيتم استدعاؤك حسب الدور."
  },
  en: {
    kioskTitle: "Self Service Kiosk",
    labelFacility: "Choose Facility",
    labelClinic: "Choose Clinic",
    labelName: "Patient Name",
    labelId: "ID / Residency No",
    labelFile:"File number (if any)",
    submit:"Confirm",
    print:"Print/View",
    confTitle:"Request Submitted",
    confText:"Your request was registered. You will be called when your turn comes."
  }
};

// عناصر DOM
const data = loadData();
document.addEventListener("DOMContentLoaded", ()=>{
  // dom elements
  const facilitySelect = document.getElementById("facilitySelect");
  const clinicSelect = document.getElementById("clinicSelect");
  const patientName = document.getElementById("patientName");
  const patientId = document.getElementById("patientId");
  const fileNumber = document.getElementById("fileNumber");
  const kioskForm = document.getElementById("kioskForm");
  const confirmation = document.getElementById("confirmation");
  const confText = document.getElementById("confText");
  const confTitle = document.getElementById("confTitle");
  const langToggle = document.getElementById("langToggle");

  function applyLang(){
    const t = TXT[LANG];
    document.getElementById("kioskTitle").innerText = t.kioskTitle;
    document.getElementById("labelFacility").innerText = t.labelFacility;
    document.getElementById("labelClinic").innerText = t.labelClinic;
    document.getElementById("labelName").innerText = t.labelName;
    document.getElementById("labelId").innerText = t.labelId;
    document.getElementById("labelFile").innerText = t.labelFile;
    document.getElementById("submitBtn").innerText = t.submit;
    document.getElementById("printBtn").innerText = t.print;
    confTitle.innerText = t.confTitle;
    confText.innerText = t.confText;
    langToggle.innerText = (LANG === "ar" ? "EN" : "AR");
  }

  // ملء قائمة المنشآت
  function fillFacilities(){
    facilitySelect.innerHTML = "";
    data.facilities.forEach((f, idx)=>{
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.text = (LANG==="ar"?f.name_ar:f.name_en);
      facilitySelect.appendChild(opt);
    });
    fillClinics();
  }

  function fillClinics(){
    const id = facilitySelect.value || data.facilities[0].id;
    const fac = data.facilities.find(x=>x.id===id);
    clinicSelect.innerHTML = "";
    if(!fac) return;
    fac.clinics.forEach(c=>{
      const opt = document.createElement("option");
      opt.value = c;
      opt.text = c;
      clinicSelect.appendChild(opt);
    });
  }

  facilitySelect.addEventListener("change", fillClinics);

  // حفظ طلب جديد
  kioskForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const item = {
      time: new Date().toISOString(),
      facility: facilitySelect.value,
      facilityLabel: facilitySelect.options[facilitySelect.selectedIndex].text,
      clinic: clinicSelect.value,
      name: patientName.value.trim(),
      id: patientId.value.trim(),
      file: fileNumber.value.trim()
    };
    data.requests.unshift(item);
    saveData(data);
    confirmation.hidden = false;
    confText.innerText = `${item.name} — ${item.facilityLabel} — ${item.clinic}`;
    kioskForm.reset();
    fillClinics();
  });

  // طباعة/عرض (يفتح نافذة للطباعة)
  document.getElementById("printBtn").addEventListener("click", ()=>{
    window.print();
  });

  // اللغة
  langToggle.addEventListener("click", ()=>{
    LANG = (LANG==="ar"?"en":"ar");
    localStorage.setItem("platform_lang", LANG);
    applyLang();
    fillFacilities();
  });

  // تهيئة
  applyLang();
  fillFacilities();

  // لوحة تحكم init (عرض الطلبات وإدارة المنشآت)
  initAdminUI();
});

// ========== قسم اللوحة (shared) ==========
function initAdminUI(){
  // عناصر admin
  const data = loadData();
  const facList = document.getElementById("facilitiesList");
  const newFacilityName = document.getElementById("newFacilityName");
  const addFacilityBtn = document.getElementById("addFacilityBtn");
  const requestsTableBody = document.querySelector("#requestsTable tbody");
  const exportCsvBtn = document.getElementById("exportCsv");
  const clearAllBtn = document.getElementById("clearAll");

  if(!facList) return; // not admin page

  function renderFacilities(){
    facList.innerHTML = "";
    data.facilities.forEach((f, i)=>{
      const div = document.createElement("div");
      div.className = "facility";
      div.innerHTML = `
        <div style="flex:1">
          <strong>${f.name_ar}</strong><br/><small>${f.name_en}</small>
        </div>
        <div>
          <button class="editBtn">تعديل</button>
          <button class="delBtn">حذف</button>
          <button class="manageClinics">العيادات</button>
        </div>
      `;
      facList.appendChild(div);

      div.querySelector(".delBtn").addEventListener("click", ()=>{
        if(!confirm("هل تريد حذف المنشأة؟")) return;
        data.facilities.splice(i,1);
        saveData(data);
        renderFacilities();
      });
      div.querySelector(".editBtn").addEventListener("click", ()=>{
        const ar = prompt("الاسم بالعربية", f.name_ar);
        const en = prompt("الاسم بالإنجليزية", f.name_en);
        if(ar) f.name_ar=ar;
        if(en) f.name_en=en;
        saveData(data); renderFacilities();
      });
      div.querySelector(".manageClinics").addEventListener("click", ()=>{
        const clinics = prompt("أدخل العيادات مفصولة بفاصلة", f.clinics.join(","));
        if(clinics!=null){
          f.clinics = clinics.split(",").map(s=>s.trim()).filter(s=>s);
          saveData(data); renderFacilities();
        }
      });
    });
  }

  addFacilityBtn.addEventListener("click", ()=>{
    const text = newFacilityName.value.trim();
    if(!text) return alert("أدخل اسم المنشأة");
    const id = text.toLowerCase().replace(/\s+/g,"_").replace(/[^\w\-]/g,"");
    data.facilities.push({ id, name_ar:text, name_en:text, clinics:["الطوارئ","الباطنية"] });
    saveData(data);
    newFacilityName.value="";
    renderFacilities();
  });

  function renderRequests(){
    requestsTableBody.innerHTML = "";
    data.requests.forEach((r, idx)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${new Date(r.time).toLocaleString()}</td>
        <td>${r.facilityLabel||r.facility}</td>
        <td>${r.clinic}</td>
        <td>${r.name}</td>
        <td>${r.id}</td>
        <td>${r.file}</td>
        <td><button class="delBtn">حذف</button></td>`;
      requestsTableBody.appendChild(tr);
      tr.querySelector(".delBtn").addEventListener("click", ()=>{
        data.requests.splice(idx,1); saveData(data); renderRequests();
      });
    });
  }

  exportCsvBtn.addEventListener("click", ()=>{
    if(!data.requests.length){ alert("لا توجد طلبات"); return; }
    const rows = [
      ["time","facility","clinic","name","id","file"],
      ...data.requests.map(r=>[r.time,r.facilityLabel||r.facility,r.clinic,r.name,r.id,r.file])
    ];
    const csv = rows.map(r => r.map(v => `"${(v||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "requests.csv"; a.click();
    URL.revokeObjectURL(url);
  });

  clearAllBtn.addEventListener("click", ()=>{
    if(!confirm("هل تريد حذف كل الطلبات؟")) return;
    data.requests = []; saveData(data); renderRequests();
  });

  renderFacilities();
  renderRequests();

}
<Route path="/reception" element={<ReceptionPage />} />


