// 1. รอให้โครงสร้างหน้าเว็บโหลดเสร็จก่อนค่อยให้ JavaScript ทำงาน
document.addEventListener('DOMContentLoaded', function() {
  // ค้นหาฟอร์มและพื้นที่แสดงผลในหน้า track.html
  const trackForm = document.getElementById('track-form');
  const trackResult = document.getElementById('track-result');

  // ถ้าไม่มีฟอร์มนี้ (เช่นเปิดไฟล์ผิดหน้า) ให้หยุดทำงาน
  if (!trackForm) return;

  // 2. ดักจับตอนที่ผู้ใช้กด "ค้นหา" (Submit Form)
  trackForm.addEventListener('submit', function(event) {
    event.preventDefault(); // ป้องกันไม่ให้หน้าเว็บรีเฟรชตามค่าเริ่มต้นของฟอร์ม

    // ดึงข้อความเลขที่แจ้งปัญหาจากช่อง input
    const searchInput = document.getElementById('search-id');
    const searchId = searchInput ? searchInput.value.trim() : '';

    // ถ้าไม่ได้พิมพ์อะไรมา ให้แจ้งเตือนและหยุด
    if (searchId === '') {
      alert('กรุณากรอกเลขที่แจ้งปัญหา เช่น FIX-2026-0001');
      return;
    }

    // 3. ดึงข้อมูลปัญหาทั้งหมดจาก localStorage (ฐานข้อมูลของเรา)
    const localData = localStorage.getItem('campus_fix_issues');
    let issues = [];
    if (localData) {
      issues = JSON.parse(localData);
    } else {
      trackResult.innerHTML = '<p class="error-message">ไม่พบฐานข้อมูลในระบบ กรุณาเข้าหน้าแรกก่อน</p>';
      return;
    }

    // 4. เอาเลขที่ผู้ใช้พิมพ์ ไปค้นหาในข้อมูลทั้งหมด
    const foundIssueIndex = issues.findIndex(item => item.id === searchId);

    // ถ้าหาไม่เจอ (ค่า index จะเป็น -1)
    if (foundIssueIndex === -1) {
      trackResult.innerHTML = `<p class="error-message" style="text-align: center; margin-top: 20px;">ไม่พบข้อมูลของเลขที่แจ้ง: <strong>${searchId}</strong></p>`;
    } else {
      // ถ้าหาเจอ ให้เอาข้อมูลปัญหาและตำแหน่งข้อมูล (index) ส่งไปฟังก์ชันแสดงผล
      const foundIssue = issues[foundIssueIndex];
      renderIssueData(foundIssue, foundIssueIndex, issues, trackResult);
    }
  });
});

// ==========================================
// ฟังก์ชันสร้างหน้าตาการ์ดและปุ่ม +1 (F5)
// ==========================================
function renderIssueData(issue, issueIndex, issuesArray, container) {
  // ดึงประวัติการกด +1 ของเครื่องนี้จาก localStorage
  // ถ้าไม่เคยมีให้สร้างเป็น array ว่างๆ []
  const votedHistory = JSON.parse(localStorage.getItem('campus_fix_voted') || '[]');
  
  // เช็กว่ารหัสปัญหานี้ (issue.id) อยู่ในประวัติการกดโหวตของเครื่องนี้หรือยัง
  const hasVoted = votedHistory.includes(issue.id);

  // เลือกคลาสสีสำหรับป้ายสถานะ (T4)
  let statusClass = '';
  if (issue.status === 'รอดำเนินการ') statusClass = 'status-pending';
  if (issue.status === 'กำลังซ่อม') statusClass = 'status-progress';
  if (issue.status === 'เสร็จสิ้น') statusClass = 'status-done';

  // สร้างหน้าตาการ์ดผลลัพธ์โดยใช้ DOM (T6)
  container.innerHTML = `
    <article class="card" style="margin-top: 24px;">
      <h3 style="margin-bottom: 8px;">ปัญหา: ${issue.category || 'ไม่ระบุ'}</h3>
      <p><strong>เลขที่แจ้ง:</strong> ${issue.id}</p>
      <p><strong>สถานที่:</strong> ${issue.building} ${issue.room || ''}</p>
      <p><strong>ความเร่งด่วน:</strong> ${issue.urgency}</p>
      <p><strong>รายละเอียด:</strong> ${issue.detail}</p>
      <p><strong>สถานะ:</strong> <span class="status-tag ${statusClass}">${issue.status}</span></p>

      <hr class="divider">

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <p style="margin: 0; font-weight: bold;">
          มีคนพบปัญหานี้: 
          <span id="vote-count" style="color: var(--primary-color); font-size: 1.2rem;">${issue.plusone || 0}</span> 
          คน
        </p>
        
        <!-- ปุ่ม +1 ถ้าเคยโหวตแล้วให้ปิดการใช้งาน (disabled) เปลี่ยนสีเป็นสีเทา (secondary-color) -->
        <button type="button" id="btn-plusone" class="btn-primary" ${hasVoted ? 'disabled style="background-color: var(--secondary-color); cursor: not-allowed;"' : ''}>
          ${hasVoted ? 'คุณโหวตแล้ว (+1)' : 'ฉันก็เจอปัญหานี้ (+1)'}
        </button>
      </div>
    </article>
  `;

  // ผูกการทำงาน (Event) ให้ปุ่ม +1
  const btnPlusOne = document.getElementById('btn-plusone');
  
  if (btnPlusOne && !hasVoted) {
    btnPlusOne.addEventListener('click', function() {
      // 1. เพิ่มตัวเลข plusone ขึ้น 1
      issue.plusone = (issue.plusone || 0) + 1;
      
      // 2. เอาข้อมูลที่อัปเดตไปใส่กลับในก้อนข้อมูลทั้งหมด
      issuesArray[issueIndex] = issue;
      
      // 3. เซฟข้อมูลทั้งหมดกลับลง localStorage (T7)
      localStorage.setItem('campus_fix_issues', JSON.stringify(issuesArray));
      
      // 4. บันทึกรหัสปัญหานี้ลงในประวัติว่าเครื่องนี้โหวตแล้ว (ป้องกันการกดซ้ำตามโจทย์ F5)
      votedHistory.push(issue.id);
      localStorage.setItem('campus_fix_voted', JSON.stringify(votedHistory));
      
      // 5. เปลี่ยนแปลงหน้าจอทันที (ไม่ต้องรีเฟรช)
      document.getElementById('vote-count').innerText = issue.plusone;
      btnPlusOne.innerText = 'คุณโหวตแล้ว (+1)';
      btnPlusOne.disabled = true;
      btnPlusOne.style.backgroundColor = 'var(--secondary-color)';
      btnPlusOne.style.cursor = 'not-allowed';
      
      alert('ขอบคุณที่ร่วมแจ้งปัญหา ข้อมูลถูกบันทึกแล้ว');
    });
  }
}