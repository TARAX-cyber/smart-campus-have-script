// ดึง Element จาก DOM
const form = document.getElementById('reportForm');
const buildingSelect = document.getElementById('building');
const successBox = document.getElementById('successBox');
const ticketIdDisplay = document.getElementById('ticketIdDisplay');

// 1. ดึงรายชื่ออาคารจริงจากไฟล์ JSON (เกณฑ์ T7 & T8)
async function loadBuildings() {
  try {
    // 📌 [จุดที่ต้องตรวจสอบ] เช็กให้แน่ใจว่าไฟล์ issues.json อยู่ในโฟลเดอร์ data/
    const response = await fetch('data/issues.json');
    
    if (!response.ok) {
      throw new Error('ไม่สามารถดึงไฟล์ issues.json ได้');
    }

    const data = await response.json();
    
    // ล้างข้อมูลตัวเลือกเดิมใน Dropdown
    buildingSelect.innerHTML = '<option value="">-- กรุณาเลือกอาคาร --</option>';
    
    // วนลูปนำรายชื่ออาคารจาก JSON มาสร้างเป็นตัวเลือกในฟอร์ม
    if (data.buildings && data.buildings.length > 0) {
      data.buildings.forEach(buildingName => {
        const option = document.createElement('option');
        option.value = buildingName;
        option.textContent = buildingName;
        buildingSelect.appendChild(option);
      });
    } else {
      buildingSelect.innerHTML = '<option value="">-- ไม่พบข้อมูลอาคาร --</option>';
    }

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการโหลดอาคาร:', error);
    buildingSelect.innerHTML = '<option value="">-- โหลดข้อมูลอาคารไม่สำเร็จ --</option>';
  }
}

// 2. ฟังก์ชันสร้างเลขที่แจ้งปัญหา (รูปแบบ FIX-2026-XXXX ตามเกณฑ์ F2)
function generateTicketId() {
  // 📌 [จุดที่อาจปรับเปลี่ยน] กำหนดรหัสประจำปี หากเป็นปีอื่นสามารถแก้เลข 2026 ได้
  const year = 2026; 
  
  // ดึงรายการปัญหาเดิมที่มีใน localStorage เพื่อคำนวณรหัสถัดไป
  const existingIssues = JSON.parse(localStorage.getItem('campus_issues')) || [];
  
  // นับจำนวนรวม (ถ้ายังไม่มีข้อมูล ให้เริ่มที่ 1)
  const nextNumber = existingIssues.length + 1;
  
  // รันเลข 4 หลัก เติมเลข 0 ข้างหน้า (เช่น 16 -> 0016)
  const formattedNumber = String(nextNumber).padStart(4, '0');
  
  return `FIX-${year}-${formattedNumber}`;
}

// 3. ฟังก์ชันตรวจความถูกต้องของข้อมูล (Form Validation)
function validateForm() {
  let isValid = true;

  // เคลียร์ข้อความแจ้งเตือนข้อผิดพลาดเก่า
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

  // ตรวจสอบหมวดหมู่
  const category = document.getElementById('category').value;
  if (!category) {
    document.getElementById('categoryError').textContent = 'กรุณาเลือกหมวดหมู่ปัญหา';
    isValid = false;
  }

  // ตรวจสอบอาคาร
  const building = document.getElementById('building').value;
  if (!building) {
    document.getElementById('buildingError').textContent = 'กรุณาเลือกอาคารสถานที่';
    isValid = false;
  }

  // ตรวจสอบชั้น/ห้อง
  const room = document.getElementById('room').value.trim();
  if (!room) {
    document.getElementById('roomError').textContent = 'กรุณาระบุชั้นหรือห้องที่พบปัญหา';
    isValid = false;
  }

  // ตรวจสอบรายละเอียด (อย่างน้อย 20 ตัวอักษร)
  const detail = document.getElementById('detail').value.trim();
  if (detail.length < 20) {
    document.getElementById('detailError').textContent = `กรุณากรอกรายละเอียดอย่างน้อย 20 ตัวอักษร (ปัจจุบันกรอกแล้ว ${detail.length} ตัวอักษร)`;
    isValid = false;
  }

  // ตรวจสอบรูปแบบอีเมล (หากผู้ใช้กรอก)
  const email = document.getElementById('email').value.trim();
  if (email !== '') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      document.getElementById('emailError').textContent = 'รูปแบบอีเมลไม่ถูกต้อง';
      isValid = false;
    }
  }

  return isValid;
}

// 4. บันทึกข้อมูลเมื่อผู้ใช้กดกดส่งฟอร์ม (Submit)
form.addEventListener('submit', function (e) {
  e.preventDefault(); // ป้องกันการ reload หน้าเพจ

  // ถ้า validation ไม่ผ่าน ให้หยุดทำงาน
  if (!validateForm()) {
    return;
  }

  // ดึงค่าระดับความเร่งด่วนที่เลือก
  const urgencyInput = document.querySelector('input[name="urgency"]:checked');
  const urgencyValue = urgencyInput ? urgencyInput.value : 'ปานกลาง';

  // สร้างเลข Ticket ID
  const newTicketId = generateTicketId();

  // สร้าง Object ข้อมูลการแจ้งปัญหา
  const newReport = {
    id: newTicketId,
    category: document.getElementById('category').value,
    building: document.getElementById('building').value,
    room: document.getElementById('room').value.trim(),
    urgency: urgencyValue,
    detail: document.getElementById('detail').value.trim(),
    email: document.getElementById('email').value.trim(),
    status: 'รอดำเนินการ',
    reportedAt: new Date().toISOString(),
    plusone: 0
  };

  // 📌 [จุดเชื่อมโยงข้อมูลกับเพื่อน] เซฟข้อมูลลง localStorage โดยใช้ Key ว่า 'campus_issues'
  let currentIssues = JSON.parse(localStorage.getItem('campus_issues')) || [];
  currentIssues.push(newReport);
  localStorage.setItem('campus_issues', JSON.stringify(currentIssues));

  // ซ่อนฟอร์มและแสดงกล่องแจ้งผลสำเร็จพร้อม Ticket ID
  form.style.display = 'none';
  successBox.style.display = 'block';
  ticketIdDisplay.textContent = newTicketId;
});

// โหลดรายการอาคารทันทีเมื่อสคริปต์ทำงาน
loadBuildings();