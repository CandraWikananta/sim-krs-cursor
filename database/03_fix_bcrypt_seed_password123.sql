-- Perbaiki password_hash seed lama yang BUKAN bcrypt valid untuk "password123".
-- Jalankan di Supabase SQL Editor jika login admin/dosen/mahasiswa gagal dengan password123.
-- Hanya mengubah baris yang masih memakai hash rusak berikut.

UPDATE admin
SET password_hash = '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W'
WHERE password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeSSqRTaEIQECdKV9p0F2IaOG';

UPDATE dosen
SET password_hash = '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W'
WHERE password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeSSqRTaEIQECdKV9p0F2IaOG';

UPDATE mahasiswa
SET password_hash = '$2b$12$rLmpy1vXnQT6n5fsq08uGOT5VYRHEAnpTG9GH345farqh3tA16m.W'
WHERE password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeSSqRTaEIQECdKV9p0F2IaOG';
