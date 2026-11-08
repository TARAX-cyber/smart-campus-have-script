document.addEventListener('DOMContentLoaded', async () => {
  const listBox = document.getElementById('issue-list');
  const filterForm = document.getElementById('filter-form');
  const countText = document.getElementById('result-count');
  
  // โหมดเจ้าหน้าที่ (F4)
  const staffSwitch = document.getElementById('staff-switch');
  const staffHint = document.getElementById('staff-hint');
  const staffTitle = document.getElementById('staff-title');

  let allIssues = [];

  // ==========================================
  // 1. ดึงข้อมูล (T7: fetch และ localStorage)
  // ==========================================
  async function loadData() {
    // โหลดปัญหาทั้งหมด
    const localData = localStorage.getItem('campus_fix_issues');
    if (localData) {
      allIssues = JSON.parse(localData);
    } else {
      try {
        const res = await fetch('data/issues.json');
        if (res.ok) {
          const data = await res.json();
          allIssues = data.issues;
          localStorage.setItem('campus_fix_issues', JSON.stringify(allIssues));
        }
      } catch (err) {
        console.error('โหลดข้อมูลปัญหาไม่สำเร็จ', err);
      }
    }

    // โหลดรายชื่ออาคารใส่ Dropdown (F2)
    try {
      const resBld = await fetch('data/issues.json');
      if (resBld.ok) {
        const dataBld = await resBld.json();
        const selBuilding = document.getElementById('f-building');
        if (dataBld.buildings && selBuilding) {
          dataBld.buildings.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.trim();
            opt.textContent = b.trim();
            selBuilding.appendChild(opt);
          });
        }
      }
    } catch (err) {
      console.error('โหลดข้อมูลอาคารไม่สำเร็จ', err);
    }

    renderIssues(); // สั่งแสดงผลครั้งแรก
  }

  // ==========================================
  // 2. ระบบกรอง และ เรียงลำดับ (F3)
  // ==========================================
  function getFilteredAndSorted() {
    const cat = document.getElementById('f-category').value;
    const bld = document.getElementById('f-building').value;
    const stat = document.getElementById('f-status').value;
    const sort = document.getElementById('f-sort').value;

    // กรองข้อมูล (Filter)
    let filtered = allIssues.filter(issue => {
      if (cat && issue.category !== cat) return false;
      if (bld && issue.building !== bld) return false;
      if (stat && issue.status !== stat) return false;
      return true;
    });

    // เรียงลำดับข้อมูล (Sort)
    filtered.sort((a, b) => {
      const dateA = new Date(a.reportedAt).getTime();
      const dateB = new Date(b.reportedAt).getTime();
      const urgPts = { 'สูง': 3, 'ปานกลาง': 2, 'ต่ำ': 1 }; // เทียบคะแนนความเร่งด่วน

      if (sort === 'date-asc') return dateA - dateB;
      if (sort === 'date-desc') return dateB - dateA;
      if (sort === 'urgency-desc') {
        const diff = (urgPts[b.urgency] || 0) - (urgPts[a.urgency] || 0);
        return diff !== 0 ? diff : dateB - dateA;
      }
      if (sort === 'plus-desc') {
        const diff = (b.plusone || 0) - (a.plusone || 0);
        return diff !== 0 ? diff : dateB - dateA;
      }
      return 0;
    });

    return filtered;
  }

  // ==========================================
  // 3. ระบบแสดงผลการ์ดปัญหา (T6: DOM Manipulation)
  // ==========================================
  function renderIssues() {
    if (!listBox) return;
    const issuesToShow = getFilteredAndSorted();
    listBox.innerHTML = ''; // ล้างค่าเดิมก่อนวาดใหม่

    if (countText) {
      countText.textContent = `พบข้อมูล ${issuesToShow.length} รายการ`;
    }

    const isStaff = staffSwitch && staffSwitch.getAttribute('aria-checked') === 'true';

    issuesToShow.forEach(issue => {
      // กำหนดสีสถานะ (T4: CSS Custom Properties)
      let statusClass = '';
      if (issue.status === 'รอดำเนินการ') statusClass = 'status-pending';
      if (issue.status === 'กำลังซ่อม') statusClass = 'status-progress';
      if (issue.status === 'เสร็จสิ้น') statusClass = 'status-done';

      // สร้างปุ่มดูรูปภาพ
      const imageBtnHtml = issue.imageUrl 
        ? `<button type="button" class="btn-view-image" data-img="${encodeURIComponent(issue.imageUrl)}" data-title="${issue.category}">📷 ดูรูปภาพ</button>` 
        : '';

      // สร้างปุ่มเปลี่ยนสถานะ (แสดงเฉพาะตอนเปิดโหมดเจ้าหน้าที่ F4)
      let staffHtml = '';
      if (isStaff) {
        staffHtml = `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--border-color);">
            <p style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">เปลี่ยนสถานะงาน (โหมดเจ้าหน้าที่):</p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="btn-primary btn-status-change" data-id="${issue.id}" data-status="รอดำเนินการ" style="font-size: 12px; padding: 5px 10px; background-color: var(--status-pending); color: #000;">รอดำเนินการ</button>
              <button type="button" class="btn-primary btn-status-change" data-id="${issue.id}" data-status="กำลังซ่อม" style="font-size: 12px; padding: 5px 10px; background-color: var(--status-progress);">กำลังซ่อม</button>
              <button type="button" class="btn-primary btn-status-change" data-id="${issue.id}" data-status="เสร็จสิ้น" style="font-size: 12px; padding: 5px 10px; background-color: var(--status-done);">เสร็จสิ้น</button>
            </div>
          </div>
        `;
      }

      // วาดการ์ด
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <h3>${issue.category || 'แจ้งปัญหา'}</h3>
        <p style="font-size: 14px; color: var(--secondary-color); margin-bottom: 8px;">รหัส: ${issue.id}</p>
        <p><strong>สถานที่:</strong> ${issue.building} ${issue.room || ''}</p>
        <p><strong>ความเร่งด่วน:</strong> <span style="color: red;">${issue.urgency}</span></p>
        <p><strong>รายละเอียด:</strong> ${issue.detail}</p>
        <p><strong>สถานะ:</strong> <span class="status-tag ${statusClass}">${issue.status}</span></p>
        ${imageBtnHtml}
        ${staffHtml}
      `;
      listBox.appendChild(card);
    });

    // ผูก Event ให้ปุ่มเปิดรูปภาพ (เชื่อมกับ Modal ใน main.js)
    document.querySelectorAll('.btn-view-image').forEach(btn => {
      btn.addEventListener('click', function() {
        if (typeof openImageModal === 'function') {
          openImageModal(decodeURIComponent(this.dataset.img), this.dataset.title);
        }
      });
    });

    // ผูก Event ให้ปุ่มเปลี่ยนสถานะ (F4)
    if (isStaff) {
      document.querySelectorAll('.btn-status-change').forEach(btn => {
        btn.addEventListener('click', function() {
          const targetId = this.dataset.id;
          const newStatus = this.dataset.status;
          updateIssueStatus(targetId, newStatus);
        });
      });
    }
  }

  // ==========================================
  // 4. ฟังก์ชันอัปเดตสถานะปัญหา (โหมดเจ้าหน้าที่ F4)
  // ==========================================
  function updateIssueStatus(issueId, newStatus) {
    const index = allIssues.findIndex(i => i.id === issueId);
    if (index !== -1) {
      allIssues[index].status = newStatus;
      localStorage.setItem('campus_fix_issues', JSON.stringify(allIssues));
      renderIssues(); // รีเฟรชการ์ดทันที
    }
  }

  // ==========================================
  // 5. ดักจับ Event ต่างๆ (T6: addEventListener)
  // ==========================================
  
  // เมื่อเปลี่ยนตัวกรอง ให้วาดรายการใหม่ทันที
  if (filterForm) {
    filterForm.addEventListener('change', renderIssues);
    filterForm.addEventListener('reset', () => setTimeout(renderIssues, 10)); // หน่วงเวลาให้ฟอร์มล้างค่าเสร็จก่อน
  }

  // ระบบสวิตช์เปิด-ปิด โหมดเจ้าหน้าที่ (F4)
  if (staffSwitch) {
    staffSwitch.addEventListener('click', function() {
      const isCurrentlyOn = this.getAttribute('aria-checked') === 'true';
      const newState = !isCurrentlyOn;
      
      this.setAttribute('aria-checked', newState.toString());
      this.querySelector('.switch-text').textContent = newState ? 'เปิด' : 'ปิด';
      
      if (newState) {
        this.classList.add('is-on');
        staffHint.textContent = 'เปิดอยู่ — เลือกเปลี่ยนสถานะงานได้เลย';
        staffTitle.style.color = 'var(--status-done)';
      } else {
        this.classList.remove('is-on');
        staffHint.textContent = 'ปิดอยู่ — เปิดเพื่อเปลี่ยนสถานะงาน';
        staffTitle.style.color = '';
      }
      
      renderIssues(); // รีเฟรชให้ปุ่มสถานะโผล่/หาย ทันที
    });
  }

  // เริ่มโหลดข้อมูลเมื่อเข้าหน้าเว็บ
  loadData();
});