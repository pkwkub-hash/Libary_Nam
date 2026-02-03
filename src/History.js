import React, { useState, useRef } from "react";
import { db } from "./firebase";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  increment,
} from "firebase/firestore";

export default function History({ userId, onBack }) {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  // States สำหรับการคืนของ
  const [returningItem, setReturningItem] = useState(null);
  const [img, setImg] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // environment=หลัง, user=หน้า
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef(null);

  // 🔄 โหลดข้อมูลประวัติ (ดึงสดจาก DB เพื่อความชัวร์)
  React.useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userDoc = await import("firebase/firestore").then((mod) =>
          mod.getDoc(doc(db, "users", userId))
        );
        if (userDoc.exists()) {
          setBorrows(userDoc.data().borrows || []);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [userId]);

  // 📷 เริ่มต้นกระบวนการคืน (เปิดกล้อง)
  const startReturn = (item) => {
    setReturningItem(item);
    setImg(null);
    setTimeout(startCamera, 100);
  };

  const startCamera = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("ไม่สามารถเปิดกล้องได้: " + err.message);
    }
  };

  // 🔄 ปุ่มสลับกล้อง
  const toggleCamera = () => {
    setFacingMode((prev) => {
      const newMode = prev === "environment" ? "user" : "environment";
      setTimeout(startCamera, 100);
      return newMode;
    });
  };

  // 📸 ถ่ายรูป
  const takeReturnPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    setImg(canvas.toDataURL("image/jpeg", 0.8));
  };

  // ✅ ยืนยันการคืน (คืน stock โดยใช้หมวดหมู่)
  const confirmReturn = async () => {
    if (!img) return alert("กรุณาถ่ายรูปยืนยัน");
    setIsProcessing(true);

    try {
      console.log("🔍 กำลังคืนหนังสือในหมวด:", returningItem.category);

      // 1. คืนสต็อกหนังสือ (ค้นหาจากหมวดหมู่)
      const q = query(
        collection(db, "books"),
        where("category", "==", returningItem.category)
      );
      const querySnapshot = await getDocs(q);

      console.log("📚 พบหนังสือในหมวด:", querySnapshot.size, "รายการ");

      if (!querySnapshot.empty) {
        // คืน stock ให้หนังสือเล่มแรกในหมวดนี้
        const firstBook = querySnapshot.docs[0];
        await updateDoc(firstBook.ref, { stock: increment(1) });
        console.log("✅ คืน stock สำเร็จ! หนังสือ:", firstBook.data().name);
      } else {
        console.log("⚠️ ไม่พบหนังสือในหมวด:", returningItem.category);
      }

      // 2. ลบรายการออกจาก User (Filter ออก)
      const newBorrows = borrows.filter(
        (b) =>
          !(
            b.bookName === returningItem.bookName &&
            b.borrowDate === returningItem.borrowDate
          )
      );

      // 3. อัปเดตข้อมูลใน Database
      await updateDoc(doc(db, "users", userId), { borrows: newBorrows });

      console.log("✅ ลบรายการยืมสำเร็จ!");
      alert(
        "✅ คืนหนังสือสำเร็จ! Stock ในหมวด " +
          returningItem.category +
          " ถูกเพิ่มแล้ว"
      );
      setBorrows(newBorrows);
      setReturningItem(null);
    } catch (e) {
      console.error("❌ Error:", e);
      alert("เกิดข้อผิดพลาด: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- UI: หน้า Loading ---
  if (isProcessing) {
    return (
      <div style={s.overlay}>
        <div style={s.spinner}></div>
        <p style={{ color: "#fff", marginTop: 20, fontWeight: "bold" }}>
          กำลังคืนหนังสือ...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- UI: หน้าถ่ายรูป ---
  if (returningItem) {
    return (
      <div style={s.container}>
        <div style={s.card}>
          <h3 style={{ color: "#1a3c34", margin: "0 0 15px 0" }}>
            คืนหนังสือ: {returningItem.bookName}
          </h3>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 15 }}>
            หมวด: {returningItem.category}
          </p>

          <div style={s.cameraBox}>
            {!img ? (
              <>
                <video ref={videoRef} autoPlay playsInline style={s.video} />
                <button onClick={toggleCamera} style={s.switchBtn}>
                  🔄 สลับกล้อง
                </button>
              </>
            ) : (
              <img src={img} alt="preview" style={s.video} />
            )}
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            {!img ? (
              <button onClick={takeReturnPhoto} style={s.btnCapture}>
                📸 ถ่ายรูป
              </button>
            ) : (
              <div style={{ width: "100%", display: "flex", gap: 10 }}>
                <button onClick={() => setImg(null)} style={s.btnRetry}>
                  ถ่ายใหม่
                </button>
                <button onClick={confirmReturn} style={s.btnConfirm}>
                  ยืนยันการคืน
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setReturningItem(null)} style={s.btnCancel}>
            ยกเลิก
          </button>
        </div>
      </div>
    );
  }

  // --- UI: หน้ารายการประวัติ ---
  return (
    <div style={s.containerList}>
      <div style={s.header}>
        <button onClick={onBack} style={s.btnBack}>
          ⬅️ กลับ
        </button>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          รายการที่ยืม ({borrows.length})
        </h2>
      </div>

      {loading ? (
        <p style={{ textAlign: "center" }}>กำลังโหลด...</p>
      ) : (
        <div style={s.list}>
          {borrows.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 50, color: "#888" }}>
              <span style={{ fontSize: 40 }}>📚</span>
              <p>ไม่มีหนังสือที่ค้างคืนครับ</p>
            </div>
          ) : (
            borrows.map((item, i) => (
              <div key={i} style={s.itemCard}>
                <div>
                  <div style={{ fontWeight: "bold", color: "#1a3c34" }}>
                    {item.bookName}
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
                    หมวด: {item.category}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    ยืมเมื่อ: {item.borrowDate}
                  </div>
                </div>
                <button onClick={() => startReturn(item)} style={s.btnReturn}>
                  คืน
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  container: {
    minHeight: "100vh",
    background: "#f0f4f3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  containerList: { minHeight: "100vh", background: "#f0f4f3", padding: 20 },
  card: {
    background: "#fff",
    padding: 25,
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },

  header: { display: "flex", alignItems: "center", marginBottom: 20, gap: 10 },
  btnBack: {
    border: "none",
    background: "none",
    fontSize: 16,
    cursor: "pointer",
  },

  list: { display: "flex", flexDirection: "column", gap: 10 },
  itemCard: {
    background: "#fff",
    padding: 15,
    borderRadius: 15,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  },

  // Camera UI
  cameraBox: {
    position: "relative",
    width: "100%",
    height: 300,
    background: "#000",
    borderRadius: 15,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  switchBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: 20,
    cursor: "pointer",
  },

  // Buttons
  btnReturn: {
    background: "#e63946",
    color: "#fff",
    border: "none",
    padding: "8px 15px",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },
  btnCapture: {
    width: "100%",
    padding: 12,
    background: "#1a3c34",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    cursor: "pointer",
  },
  btnRetry: {
    flex: 1,
    padding: 12,
    background: "#888",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  btnConfirm: {
    flex: 1,
    padding: 12,
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },
  btnCancel: {
    marginTop: 10,
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer",
    textDecoration: "underline",
  },

  // Overlay
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  spinner: {
    width: 50,
    height: 50,
    border: "5px solid rgba(255,255,255,0.3)",
    borderTop: "5px solid #fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};
