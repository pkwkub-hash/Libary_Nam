import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";

// 📚 หมวดหมู่หนังสือ
const categories = [
  { id: "000", name: "ทั่วไป คอมพิวเตอร์" },
  { id: "100", name: "ปรัชญา" },
  { id: "200", name: "ศาสนา" },
  { id: "300", name: "สังคมศาสตร์" },
  { id: "400", name: "ภาษาศาสตร์" },
  { id: "500", name: "วิทยาศาสตร์" },
  { id: "600", name: "เทคโนโลยี" },
  { id: "700", name: "ศิลปะ" },
  { id: "800", name: "วรรณกรรม" },
  { id: "900", name: "ประวัติศาสตร์" },
];

// 🖼️ ดึง coverURL จากหมวดหมู่ เช่น "ทั่วไป คอมพิวเตอร์" => "/000.jpg"
const getCoverByCategory = (categoryName) => {
  const cat = categories.find((c) => c.name === categoryName);
  return cat ? `/${cat.id}.jpg` : "/000.jpg";
};

export default function Staff({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [allBorrows, setAllBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔍 ฟิลเตอร์สำหรับรายการยืม
  const [searchText, setSearchText] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // สำหรับเพิ่มหนังสือใหม่
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({
    category: "",
    stock: 0,
  });

  // 🖼️ Modal แสดงรูปภาพ
  const [viewImage, setViewImage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // โหลดข้อมูล Users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);

      // โหลดข้อมูล Books
      const booksSnap = await getDocs(collection(db, "books"));
      const booksList = booksSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBooks(booksList);

      // รวมรายการยืมทั้งหมด
      const borrowsList = [];
      usersList.forEach((u) => {
        if (u.borrows && u.borrows.length > 0) {
          u.borrows.forEach((b) => {
            borrowsList.push({
              ...b,
              userName: u.name || u.email,
              userEmail: u.email,
              studentId: u.studentId || "-",
              level: u.level || "-",
              userId: u.id,
              status: b.returnDate ? "returned" : "borrowed",
            });
          });
        }
      });
      setAllBorrows(borrowsList);
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเพิ่มหนังสือ
  const addBook = async () => {
    if (!newBook.category) {
      return alert("กรุณาเลือกหมวดหมู่");
    }
    try {
      const coverURL = getCoverByCategory(newBook.category);
      await setDoc(doc(collection(db, "books")), {
        name: newBook.category,
        category: newBook.category,
        stock: parseInt(newBook.stock) || 0,
        coverURL: coverURL,
        createdAt: new Date().toISOString(),
      });
      alert("เพิ่มหนังสือสำเร็จ!");
      setShowAddBook(false);
      setNewBook({ category: "", stock: 0 });
      loadData();
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
  };

  // ฟังก์ชันลบหนังสือ
  const deleteBook = async (bookId) => {
    if (!window.confirm("ยืนยันลบหนังสือนี้?")) return;
    try {
      await deleteDoc(doc(db, "books", bookId));
      alert("ลบหนังสือสำเร็จ!");
      loadData();
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
  };

  // ฟังก์ชันเพิ่ม/ลด Stock
  const updateStock = async (bookId, change) => {
    try {
      const bookRef = doc(db, "books", bookId);
      const currentBook = books.find((b) => b.id === bookId);
      const newStock = Math.max(0, (currentBook.stock || 0) + change);
      await updateDoc(bookRef, { stock: newStock });
      loadData();
    } catch (e) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    }
  };

  // 🔍 ฟังก์ชันกรองรายการยืม
  const getFilteredBorrows = () => {
    let filtered = [...allBorrows];

    if (searchText) {
      filtered = filtered.filter(
        (b) =>
          b.userName.toLowerCase().includes(searchText.toLowerCase()) ||
          b.studentId.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterLevel !== "all") {
      filtered = filtered.filter((b) =>
        b.level.toLowerCase().includes(filterLevel.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((b) => b.status === filterStatus);
    }

    return filtered;
  };

  if (loading) {
    return (
      <div style={s.loading}>
        <div style={s.spinner}></div>
        <p>กำลังโหลดข้อมูล...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const filteredBorrows = getFilteredBorrows();

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>👔 Dashboard เจ้าหน้าที่</h2>
          <p style={s.subtitle}>ผู้ใช้: {user?.email} | Role: เจ้าหน้าที่</p>
        </div>
        <button onClick={onSignOut} style={s.btnSignOut}>
          ออกจากระบบ
        </button>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button
          onClick={() => setActiveTab("users")}
          style={activeTab === "users" ? s.tabActive : s.tab}
        >
          👥 ดูข้อมูลผู้ใช้ ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("books")}
          style={activeTab === "books" ? s.tabActive : s.tab}
        >
          📚 จัดการหนังสือ ({books.length})
        </button>
        <button
          onClick={() => setActiveTab("borrows")}
          style={activeTab === "borrows" ? s.tabActive : s.tab}
        >
          📋 รายการยืมทั้งหมด ({allBorrows.length})
        </button>
      </div>

      {/* Content */}
      <div style={s.content}>
        {/* TAB: Users (เจ้าหน้าที่ดูได้อย่างเดียว ไม่สามารถแก้ไข) */}
        {activeTab === "users" && (
          <div>
            <h3 style={s.sectionTitle}>รายชื่อผู้ใช้ทั้งหมด</h3>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 15 }}>
              ℹ️ เจ้าหน้าที่สามารถดูข้อมูลเท่านั้น ไม่สามารถแก้ไขได้
            </p>
            {users.length === 0 ? (
              <p style={{ textAlign: "center", color: "#999" }}>
                ไม่มีข้อมูลผู้ใช้
              </p>
            ) : (
              <div style={s.table}>
                {users.map((u) => (
                  <div key={u.id} style={s.row}>
                    <div style={s.userInfo}>
                      <div style={s.userName}>{u.name || "ไม่ระบุชื่อ"}</div>
                      <div style={s.userEmail}>{u.email}</div>
                      <div style={s.userDetail}>
                        รหัส: {u.studentId || "-"} | ระดับ: {u.level || "-"} |
                        แผนก: {u.department || "-"}
                      </div>
                      <div style={s.userDetail}>
                        Role: <strong>{u.role || "user"}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Books */}
        {activeTab === "books" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3 style={s.sectionTitle}>รายการหนังสือทั้งหมด</h3>
              <button onClick={() => setShowAddBook(true)} style={s.btnAdd}>
                + เพิ่มหนังสือ
              </button>
            </div>

            {books.length === 0 ? (
              <p style={{ textAlign: "center", color: "#999" }}>
                ไม่มีหนังสือในระบบ
              </p>
            ) : (
              <div style={s.table}>
                {books.map((b) => (
                  <div key={b.id} style={s.row}>
                    <div style={s.bookInfo}>
                      <img
                        src={b.coverURL || getCoverByCategory(b.category)}
                        alt={b.name}
                        style={s.bookCover}
                      />
                      <div>
                        <div style={s.bookName}>{b.name}</div>
                        <div style={s.bookCategory}>
                          หมวด: {b.category || "-"}
                        </div>
                        <div style={s.bookStock}>
                          สต็อก:{" "}
                          <span
                            style={{
                              color: b.stock > 0 ? "#10b981" : "#ef4444",
                              fontWeight: "bold",
                            }}
                          >
                            {b.stock || 0}
                          </span>{" "}
                          เล่ม
                        </div>
                      </div>
                    </div>
                    <div style={s.actions}>
                      <button
                        onClick={() => updateStock(b.id, 1)}
                        style={s.btnStockUp}
                      >
                        +
                      </button>
                      <button
                        onClick={() => updateStock(b.id, -1)}
                        style={s.btnStockDown}
                      >
                        -
                      </button>
                      <button
                        onClick={() => deleteBook(b.id)}
                        style={s.btnDelete}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal เพิ่มหนังสือ */}
            {showAddBook && (
              <div style={s.overlay}>
                <div style={s.modal}>
                  <h3 style={s.modalTitle}>เพิ่มหนังสือใหม่</h3>

                  {/* Preview รูปปก อัตโมัติจากหมวดหมู่ */}
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <img
                      src={
                        newBook.category
                          ? getCoverByCategory(newBook.category)
                          : "/000.jpg"
                      }
                      alt="preview"
                      style={{
                        width: 90,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 10,
                        border: "2px solid #e5e7eb",
                      }}
                    />
                    <p
                      style={{
                        fontSize: 12,
                        color: "#999",
                        marginTop: 6,
                        marginBottom: 0,
                      }}
                    >
                      รูปปกจากหมวดหมู่
                    </p>
                  </div>

                  <select
                    value={newBook.category}
                    onChange={(e) =>
                      setNewBook({ ...newBook, category: e.target.value })
                    }
                    style={s.input}
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.id} - {cat.name}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="จำนวนสต็อก"
                    type="number"
                    value={newBook.stock}
                    onChange={(e) =>
                      setNewBook({ ...newBook, stock: e.target.value })
                    }
                    style={s.input}
                  />
                  <div style={s.modalActions}>
                    <button
                      onClick={() => setShowAddBook(false)}
                      style={s.btnCancel}
                    >
                      ยกเลิก
                    </button>
                    <button onClick={addBook} style={s.btnConfirm}>
                      เพิ่ม
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Borrows */}
        {activeTab === "borrows" && (
          <div>
            <h3 style={s.sectionTitle}>รายการยืมทั้งหมดในระบบ</h3>

            {/* 🔍 ส่วนค้นหาและกรอง */}
            <div style={s.filterBox}>
              <input
                type="text"
                placeholder="🔍 ค้นหาชื่อหรือรหัสนักศึกษา..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={s.searchInput}
              />

              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                style={s.filterSelect}
              >
                <option value="all">ทุกระดับชั้น</option>
                <option value="ปวช">ปวช.</option>
                <option value="ปวส">ปวส.</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={s.filterSelect}
              >
                <option value="all">ทุกสถานะ</option>
                <option value="borrowed">ยังไม่คืน</option>
                <option value="returned">คืนแล้ว</option>
              </select>

              <button
                onClick={() => {
                  setSearchText("");
                  setFilterLevel("all");
                  setFilterStatus("all");
                }}
                style={s.btnReset}
              >
                ล้างตัวกรอง
              </button>
            </div>

            <p style={{ color: "#666", marginBottom: 15, fontSize: 14 }}>
              พบ {filteredBorrows.length} รายการจากทั้งหมด {allBorrows.length}{" "}
              รายการ
            </p>

            {filteredBorrows.length === 0 ? (
              <p style={{ textAlign: "center", color: "#999", marginTop: 50 }}>
                ไม่พบรายการยืมตามเงื่อนไขที่ค้นหา
              </p>
            ) : (
              <div style={s.table}>
                {filteredBorrows.map((b, i) => (
                  <div key={i} style={s.row}>
                    {b.photoURL && (
                      <img
                        src={b.photoURL}
                        alt="รูปยืมหนังสือ"
                        style={s.borrowImage}
                        onClick={() => setViewImage(b.photoURL)}
                        title="คลิกเพื่อดูรูปขยาย"
                      />
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={s.borrowBook}>📖 {b.bookName}</div>
                      <div style={s.borrowUser}>
                        ผู้ยืม: {b.userName} ({b.userEmail})
                      </div>
                      <div style={s.borrowDetail}>
                        รหัส: {b.studentId} | ระดับ: {b.level}
                      </div>
                      <div style={s.borrowDate}>
                        ยืมเมื่อ: {b.date || b.borrowDate || "-"}
                      </div>
                      {b.returnDate && (
                        <div style={s.returnDate}>
                          ✅ คืนแล้วเมื่อ: {b.returnDate}
                        </div>
                      )}
                    </div>

                    <div>
                      {b.status === "borrowed" ? (
                        <span style={s.badgeBorrowed}>ยังไม่คืน</span>
                      ) : (
                        <span style={s.badgeReturned}>คืนแล้ว</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🖼️ Modal แสดงรูปภาพขยาย */}
      {viewImage && (
        <div style={s.overlay} onClick={() => setViewImage(null)}>
          <div style={s.imageModal} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewImage(null)} style={s.btnCloseImage}>
              ✕
            </button>
            <img src={viewImage} alt="รูปยืมหนังสือ" style={s.fullImage} />
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { minHeight: "100vh", background: "#f5f5f5" },
  loading: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#1a3c34",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #1a3c34",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: 15,
  },
  header: {
    background: "#1a3c34",
    color: "#fff",
    padding: "20px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { margin: 0, fontSize: 24 },
  subtitle: { margin: "5px 0 0 0", fontSize: 14, opacity: 0.9 },
  btnSignOut: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },
  tabs: {
    display: "flex",
    background: "#fff",
    borderBottom: "2px solid #e5e7eb",
    padding: "0 20px",
  },
  tab: {
    background: "none",
    border: "none",
    padding: "15px 20px",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
    borderBottom: "3px solid transparent",
  },
  tabActive: {
    background: "none",
    border: "none",
    padding: "15px 20px",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: "bold",
    color: "#1a3c34",
    borderBottom: "3px solid #1a3c34",
  },
  content: { padding: 30, maxWidth: 1200, margin: "0 auto" },
  sectionTitle: { color: "#1a3c34", marginBottom: 20, fontSize: 20 },
  filterBox: {
    background: "#fff",
    padding: 20,
    borderRadius: 15,
    display: "flex",
    gap: 10,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: 200,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ddd",
    fontSize: 14,
  },
  filterSelect: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ddd",
    fontSize: 14,
    cursor: "pointer",
  },
  btnReset: {
    padding: "10px 20px",
    background: "#f3f4f6",
    color: "#333",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },
  table: { display: "flex", flexDirection: "column", gap: 15 },
  row: {
    background: "#fff",
    padding: 20,
    borderRadius: 15,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    gap: 15,
  },
  userInfo: { flex: 1 },
  userName: { fontWeight: "bold", color: "#1a3c34", fontSize: 16 },
  userEmail: { color: "#666", fontSize: 14, marginTop: 5 },
  userDetail: { color: "#999", fontSize: 13, marginTop: 5 },
  bookInfo: { display: "flex", gap: 15, alignItems: "center", flex: 1 },
  bookCover: { width: 60, height: 80, objectFit: "cover", borderRadius: 8 },
  bookName: { fontWeight: "bold", color: "#1a3c34", fontSize: 16 },
  bookCategory: { color: "#666", fontSize: 14, marginTop: 5 },
  bookStock: { color: "#999", fontSize: 14, marginTop: 5 },
  borrowBook: { fontWeight: "bold", color: "#1a3c34", fontSize: 16 },
  borrowUser: { color: "#666", fontSize: 14, marginTop: 5 },
  borrowDetail: { color: "#999", fontSize: 13, marginTop: 3 },
  borrowDate: { color: "#999", fontSize: 13, marginTop: 5 },
  returnDate: {
    color: "#10b981",
    fontSize: 13,
    marginTop: 5,
    fontWeight: "bold",
  },
  borrowImage: {
    width: 80,
    height: 100,
    objectFit: "cover",
    borderRadius: 10,
    cursor: "pointer",
    border: "2px solid #e5e7eb",
  },
  badgeBorrowed: {
    display: "inline-block",
    padding: "5px 12px",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
  },
  badgeReturned: {
    display: "inline-block",
    padding: "5px 12px",
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
  },
  actions: { display: "flex", gap: 10, alignItems: "center" },
  btnDelete: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "8px 15px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "bold",
    cursor: "pointer",
  },
  btnStockUp: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  },
  btnStockDown: {
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  },
  btnAdd: {
    background: "#1a3c34",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(3px)",
  },
  modal: {
    background: "#fff",
    padding: 30,
    borderRadius: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: { color: "#1a3c34", marginBottom: 20, fontSize: 20 },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ddd",
    marginBottom: 15,
    boxSizing: "border-box",
    fontSize: 15,
  },
  modalActions: { display: "flex", gap: 10, marginTop: 20 },
  btnCancel: {
    flex: 1,
    padding: 12,
    background: "#f3f4f6",
    color: "#333",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },
  btnConfirm: {
    flex: 1,
    padding: 12,
    background: "#1a3c34",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  },
  imageModal: {
    position: "relative",
    background: "#fff",
    borderRadius: 20,
    padding: 20,
    maxWidth: "90%",
    maxHeight: "90%",
  },
  fullImage: {
    maxWidth: "100%",
    maxHeight: "80vh",
    objectFit: "contain",
    borderRadius: 10,
  },
  btnCloseImage: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "#ef4444",
    color: "#fff",
    border: "none",
    width: 35,
    height: 35,
    borderRadius: "50%",
    fontSize: 20,
    cursor: "pointer",
    fontWeight: "bold",
  },
};
