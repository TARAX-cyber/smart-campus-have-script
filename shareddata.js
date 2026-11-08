// common.js
// ไฟล์นี้ใช้ร่วมกันทุกหน้า มีหน้าที่โหลดข้อมูลและเก็บข้อมูลใน localStorage

// ชื่อ key ที่ใช้เก็บข้อมูลในเบราว์เซอร์
const STORAGE_KEY_NEW = 'fixit.newIssues';   // ปัญหาที่ผู้ใช้แจ้งใหม่
const STORAGE_KEY_CHANGES = 'fixit.changes';        // สถานะที่เจ้าหน้าที่เปลี่ยน
const STORAGE_KEY_STAFF = 'fixit.staff';            // เปิดหรือปิดโหมดเจ้าหน้าที่

// สถานะทั้ง 3 ขั้น เรียงตามลำดับ
const STATUS_STEPS = ['รอดำเนินการ', 'กำลังซ่อม', 'เสร็จสิ้น'];

// อ่านข้อมูลจาก localStorage ถ้าอ่านไม่ได้ให้ใช้ค่าเริ่มต้น (defaultValue)
function getFromStorage(key, defaultValue) {
  try {
    const text = localStorage.getItem(key);
    if (text === null) {
      return defaultValue;
    }
    return JSON.parse(text);
  } catch (error) {
    return defaultValue;
  }
}

// เก็บข้อมูลลง localStorage ถ้าสำเร็จคืนค่า true ถ้าไม่สำเร็จคืนค่า false
function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

// โหลดปัญหาทั้งหมด = ข้อมูลจาก issues.json + ปัญหาที่แจ้งใหม่
// แล้วเอาสถานะที่เจ้าหน้าที่เปลี่ยนไว้ มาใส่ทับ
async function loadIssueData() {
  const response = await fetch('data/issues.json');
  if (!response.ok) {
    throw new Error('โหลดไฟล์ไม่สำเร็จ');
  }
  const data = await response.json();

  const newIssues = getFromStorage(STORAGE_KEY_NEW, []);
  const changes = getFromStorage(STORAGE_KEY_CHANGES, {});

  // รวมปัญหาจาก 2 แหล่งไว้ในรายการเดียว
  const issueData = data.issues.concat(newIssues);

  // ตรวจทีละรายการว่ามีการเปลี่ยนสถานะไหม
  for (let i = 0; i < issueData.length; i++) {
    const issue = issueData[i];
    const change = changes[issue.id];
    if (change) {
      issue.status = change.status;
      issue.history = change.history;
    }
  }

  return { buildings: data.buildings, issues: issueData };
}

// เปลี่ยนสถานะของปัญหา แล้วบันทึกประวัติไว้ (เอาไปทำ Timeline ได้)
// ถ้าบันทึกสำเร็จ คืนค่าประวัติใหม่ ถ้าไม่สำเร็จ คืนค่า null
function updateIssueStatus(issue, newStatus) {
  const changes = getFromStorage(STORAGE_KEY_CHANGES, {});

  // ถ้ายังไม่มีประวัติ ให้เริ่มจากสถานะตอนแจ้ง
  let history = issue.history;
  if (!history) {
    history = [{ status: issue.status, at: issue.reportedAt }];
  }

  // เพิ่มประวัติใหม่ต่อท้าย
  history.push({ status: newStatus, at: new Date().toISOString() });

  changes[issue.id] = { status: newStatus, history: history };

  const ok = setToStorage(STORAGE_KEY_CHANGES, changes);
  if (ok) {
    return history;
  }
  return null;
}