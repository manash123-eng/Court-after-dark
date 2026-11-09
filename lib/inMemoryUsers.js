// lib/inMemoryUsers.js
// Shared in-memory user store for demo and offline execution when MongoDB is unconfigured or sandboxed.

import bcrypt from "bcryptjs";

// Pre-computed hash for demo password "Password123!"
const DEFAULT_HASH = bcrypt.hashSync("Password123!", 8);

const INITIAL_USERS = [
  {
    _id: "usr_superadmin",
    id: "usr_superadmin",
    name: "Dr. Balraj Singh",
    email: "superadmin@lpu.co.in",
    phone: "+919856789012",
    rawPhone: "9856789012",
    password: DEFAULT_HASH,
    role: "super_admin",
    studentCategory: "Faculty / Staff",
    department: "Division of Student Welfare (DSW)",
    status: "active",
    phoneVerified: true,
  },
  {
    _id: "usr_admin",
    id: "usr_admin",
    name: "LPU Sports Admin",
    email: "admin@courtsafterdark.com",
    phone: "+919876543210",
    rawPhone: "9876543210",
    password: DEFAULT_HASH,
    role: "sports_admin",
    studentCategory: "Faculty / Staff",
    department: "Department of Sports",
    status: "active",
    phoneVerified: true,
  },
  {
    _id: "usr_coach",
    id: "usr_coach",
    name: "Coach Sandeep Kumar",
    email: "coach.sandeep@lpu.co.in",
    phone: "+919834567890",
    rawPhone: "9834567890",
    password: DEFAULT_HASH,
    role: "coach",
    studentCategory: "Faculty / Staff",
    department: "School of Physical Education",
    status: "active",
    phoneVerified: true,
  },
  {
    _id: "usr_store",
    id: "usr_store",
    name: "Gurpreet Singh (Sports Store)",
    email: "store.gurpreet@lpu.co.in",
    phone: "+919845678901",
    rawPhone: "9845678901",
    password: DEFAULT_HASH,
    role: "equipment_manager",
    studentCategory: "Faculty / Staff",
    department: "Shanti Devi Mittal Central Store",
    status: "active",
    phoneVerified: true,
  },
  {
    _id: "usr_student",
    id: "usr_student",
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "+917828722557",
    rawPhone: "7828722557",
    password: DEFAULT_HASH,
    role: "student",
    studentCategory: "Hosteller with EDB",
    regNo: "12104822",
    department: "School of Computer Science & Engineering",
    hostelBlock: "Boys Hostel 4 (BH-4)",
    gender: "Male",
    status: "active",
    phoneVerified: true,
  },
  {
    _id: "usr_rohan",
    id: "usr_rohan",
    name: "Rohan Verma (National Gold)",
    email: "rohan@example.com",
    phone: "+919812345678",
    rawPhone: "9812345678",
    password: DEFAULT_HASH,
    role: "student",
    studentCategory: "Outstanding Sportsperson",
    regNo: "12117540",
    department: "School of Physical Education",
    hostelBlock: "Boys Hostel 1 (BH-1)",
    isComplimentaryApproved: true,
    gender: "Male",
    status: "active",
    phoneVerified: true,
  },
  {
    _id: "usr_priya",
    id: "usr_priya",
    name: "Priya Patel",
    email: "priya@example.com",
    phone: "+919823456789",
    rawPhone: "9823456789",
    password: DEFAULT_HASH,
    role: "student",
    studentCategory: "Day Scholar",
    regNo: "12209314",
    department: "School of Business",
    gender: "Female",
    status: "active",
    phoneVerified: true,
  },
];

let inMemoryUsers = global._inMemoryUsers;
if (!inMemoryUsers) {
  inMemoryUsers = global._inMemoryUsers = [...INITIAL_USERS];
}

export function findInMemoryUser(identifier) {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const digitsOnly = identifier.replace(/\D/g, "");

  return (
    inMemoryUsers.find((u) => {
      if (u.email.toLowerCase() === clean) return true;
      if (u.phone && u.phone.toLowerCase() === clean) return true;
      if (digitsOnly && digitsOnly.length >= 10) {
        const uDigits = (u.phone || "").replace(/\D/g, "");
        if (uDigits.endsWith(digitsOnly.slice(-10))) return true;
      }
      return false;
    }) || null
  );
}

export function getInMemoryUserById(id) {
  if (!id) return null;
  return inMemoryUsers.find((u) => u._id === id || u.id === id) || null;
}

export function createInMemoryUser(userData) {
  const newUser = {
    _id: userData._id || "usr_" + Date.now(),
    id: userData._id || "usr_" + Date.now(),
    name: userData.name,
    email: userData.email.toLowerCase(),
    phone: userData.phone || "",
    rawPhone: (userData.phone || "").replace(/\D/g, ""),
    password: userData.password,
    role: userData.role || "student",
    studentCategory: userData.studentCategory || "Hosteller with EDB",
    regNo: userData.regNo || "",
    department: userData.department || "",
    hostelBlock: userData.hostelBlock || "",
    gender: userData.gender || "Other",
    status: "active",
    phoneVerified: true,
    createdAt: new Date().toISOString(),
  };

  inMemoryUsers.unshift(newUser);
  return newUser;
}

export function getAllInMemoryUsers() {
  return inMemoryUsers;
}
