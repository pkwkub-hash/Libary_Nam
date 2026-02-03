import React, { useState, useEffect } from "react";

const departments = [
  
  {
    id: 1,
    name: "แผนกวิชาการบัญชี",
    folder: "accounting",
    cover: "/accounting.png",
    imageCount: 8,
    fileType: "jpg",
  },
  {
    id: 2,
    name: "แผนกวิชาไฟฟ้ากำลัง",
    folder: "electrical",
    cover: "/electrical.png",
    imageCount: 16,
    fileType: "jpg",
  },
  {
    id: 3,
    name: "แผนกวิชาการตลาด",
    folder: "marketing",
    cover: "/marketing.png",
    imageCount: 8,
    fileType: "jpg",
  },
  {
    id: 4,
    name: "แผนกวิชาคอมพิวเตอร์ธุรกิจ",
    folder: "business-computer",
    cover: "/business-computer.png",
    imageCount: 14,
    fileType: "jpg",
  },
  {
    id: 5,
    name: "แผนกวิชาช่างยนต์",
    folder: "automotive",
    cover: "/automotive.png",
    imageCount: 3,
    fileType: "jpg",
  },
  {
    id: 6,
    name: "แผนกวิชาเทคนิคพื้นฐาน",
    folder: "basic-techniques",
    cover: "/basic-techniques.png",
    imageCount: 6,
    fileType: "jpg",
  },
  {
    id: 7,
    name: "แผนกวิชาสามัญสัมพันธ์",
    folder: "general-education",
    cover: "/general-education.png",
    imageCount: 7,
    fileType: "jpg",
  },
  {
    id: 8,
    name: "แผนกวิชาอิเล็กทรอนิกส์",
    folder: "electronics",
    cover: "/electronics.png",
    imageCount: 3,
    fileType: "jpg",
  },
];

export default function OnlineMedia({ onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const isMobile = window.innerWidth <= 768;

  // โหลดหน้าปก (Cover)
  useEffect(() => {
    const cacheCovers = async () => {
      const promises = departments.map(
        (d) =>
          new Promise((res) => {
            const img = new Image();
            img.src = d.cover;
            img.onload = res;
            img.onerror = res;
          })
      );
      await Promise.all(promises);
      setIsLoading(false);
    };
    cacheCovers();
  }, []);

  // ฟังก์ชันเปิดแผนก
  const handleOpenDept = async (dept) => {
    setSelectedDept(dept);
    setIsGalleryLoading(true);

    // ✅ ดึงรูปตามนามสกุล .jpg ที่ตั้งไว้
    const imagePaths = [...Array(dept.imageCount)].map(
      (_, i) => `/${dept.folder}/${i + 1}.${dept.fileType}`
    );

    const loadImages = imagePaths.map(
      (path) =>
        new Promise((res) => {
          const img = new Image();
          img.src = path;
          img.onload = res;
          img.onerror = res;
        })
    );

    await Promise.all(loadImages);
    setTimeout(() => setIsGalleryLoading(false), 500);
  };

  if (isLoading) {
    return (
      <div style={styles.fullPageLoading}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "15px", color: "#1a3c34" }}>
          กำลังเตรียมข้อมูล...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.btnBack}>
          ⬅️ กลับ
        </button>
        <h2 style={styles.title}>สื่อออนไลน์แผนกวิชา</h2>
      </div>

      <div style={styles.content}>
        <div
          style={{
            ...styles.grid,
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
          }}
        >
          {departments.map((dept) => (
            <div
              key={dept.id}
              style={styles.card}
              onClick={() => handleOpenDept(dept)}
            >
              <div style={styles.imageContainer}>
                <img src={dept.cover} alt={dept.name} style={styles.image} />
                <div style={styles.overlay}>
                  <span style={styles.clickText}>เปิดคลังสื่อ</span>
                </div>
              </div>
              <div style={styles.cardBody}>
                <h3 style={styles.deptName}>{dept.name}</h3>
                <span style={styles.badge}>{dept.imageCount} รายการ</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popup Gallery */}
      {selectedDept && (
        <div style={styles.modalOverlay} onClick={() => setSelectedDept(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Loading บังหน้าจนกว่ารูปจะมา */}
            {isGalleryLoading && (
              <div style={styles.galleryLoadingLayer}>
                <div style={styles.spinner}></div>
                <p style={{ marginTop: "10px" }}>กำลังโหลดรูปภาพ...</p>
              </div>
            )}

            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{selectedDept.name}</h3>
              <button
                style={styles.btnClose}
                onClick={() => setSelectedDept(null)}
              >
                ❌ ปิด
              </button>
            </div>

            <div style={styles.galleryGrid}>
              {[...Array(selectedDept.imageCount)].map((_, i) => {
                const imgPath = `/${selectedDept.folder}/${i + 1}.${
                  selectedDept.fileType
                }`;
                return (
                  <div
                    key={i}
                    style={{ textAlign: "center" }}
                    onClick={() => setZoomImage(imgPath)}
                  >
                    <div style={styles.thumbWrapper}>
                      <img
                        src={imgPath}
                        alt={`work-${i + 1}`}
                        style={styles.galleryThumb}
                      />
                    </div>
                    <div style={styles.label}>ชิ้นที่ {i + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Zoom Popup */}
      {zoomImage && (
        <div style={styles.zoomOverlay} onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="Zoom" style={styles.zoomImg} />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#f0f4f3" },
  header: {
    background: "#1a3c34",
    color: "#fff",
    padding: "15px 20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  btnBack: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
  },
  title: { margin: 0, fontSize: "18px" },
  content: { maxWidth: "1200px", margin: "0 auto", padding: "20px" },
  grid: { display: "grid", gap: "20px" },
  card: {
    background: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  imageContainer: { position: "relative", aspectRatio: "3/4" },
  image: { width: "100%", height: "100%", objectFit: "cover" },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(26,60,52,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
    transition: "0.3s",
  },
  clickText: { color: "#fff", fontWeight: "bold" },
  cardBody: { padding: "12px", textAlign: "center" },
  deptName: { fontSize: "14px", margin: "0 0 5px 0" },
  badge: {
    fontSize: "12px",
    background: "#e8f5f3",
    padding: "2px 8px",
    borderRadius: "10px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    position: "relative",
    background: "#fff",
    width: "100%",
    maxWidth: "900px",
    maxHeight: "80vh",
    borderRadius: "15px",
    overflowY: "auto",
    padding: "20px",
  },
  galleryLoadingLayer: {
    position: "absolute",
    inset: 0,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
  },
  btnClose: {
    border: "none",
    background: "#f5f5f5",
    padding: "5px 10px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  galleryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "15px",
  },
  thumbWrapper: {
    width: "100%",
    aspectRatio: "3/4",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#f9f9f9",
    cursor: "zoom-in",
  },
  galleryThumb: { width: "100%", height: "100%", objectFit: "cover" },
  label: { fontSize: "12px", marginTop: "5px", color: "#666" },

  zoomOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.95)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  zoomImg: { maxWidth: "95%", maxHeight: "90%", borderRadius: "10px" },

  fullPageLoading: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f0f4f3",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #1a3c34",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } 
div[style*="card"]:hover [style*="overlay"] { opacity: 1 !important; }`;
document.head.appendChild(styleSheet);
