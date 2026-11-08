// ฟังก์ชันสร้างหน้าแดชบอร์ด (F6)
async function renderDashboard() {
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  // ดึงข้อมูลจากฟังก์ชัน getIssuesData() ใน main.js
  const issues = await getIssuesData();
  if (issues.length === 0) {
    container.innerHTML = '<p>ยังไม่มีข้อมูลปัญหาในระบบ</p>';
    return;
  }

  const total = issues.length;
  const statusCount = { 'รอดำเนินการ': 0, 'กำลังซ่อม': 0, 'เสร็จสิ้น': 0 };
  const categoryCount = {};

  // นับจำนวน
  issues.forEach(issue => {
    if (statusCount[issue.status] !== undefined) statusCount[issue.status]++;
    categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
  });

  // ฟังก์ชันตัวช่วยสร้างแท่งกราฟ CSS (กำหนด width เป็น % ตามกฎ F6)
  const createBar = (label, count, max, cssClass) => {
    const percent = max > 0 ? Math.round((count / max) * 100) : 0;
    return `
      <div class="bar-item">
        <div class="bar-header">
          <span>${label}</span>
          <span>${count} รายการ (${percent}%)</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill ${cssClass}" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
  };

  // สร้าง HTML สรุป
  let html = `
    <div class="summary-grid">
      <div class="summary-card">
        <h3>ปัญหาทั้งหมด</h3>
        <div class="summary-number">${total}</div>
      </div>
    </div>

    <div class="chart-container">
      <h3>แยกตามสถานะ</h3>
      ${createBar('รอดำเนินการ', statusCount['รอดำเนินการ'], total, 'bar-fill-pending')}
      ${createBar('กำลังซ่อม', statusCount['กำลังซ่อม'], total, 'bar-fill-progress')}
      ${createBar('เสร็จสิ้น', statusCount['เสร็จสิ้น'], total, 'bar-fill-done')}
    </div>

    <div class="chart-container">
      <h3>แยกตามหมวดหมู่</h3>
  `;

  for (const [cat, count] of Object.entries(categoryCount)) {
    html += createBar(cat, count, total, 'bar-fill-category');
  }

  html += `</div>`;
  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', renderDashboard);