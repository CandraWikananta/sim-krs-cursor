export type Role = "mahasiswa" | "dosen" | "admin";

export type KrsStatus = "diajukan" | "disetujui" | "ditolak";

export interface Mahasiswa {
  id: string;
  nim: string;
  nama: string;
  email: string;
  semester: number;
  jurusan: string | null;
  dosen_pa_id: string | null;
  created_at?: string;
}

export interface Dosen {
  id: string;
  nidn: string;
  nama: string;
  email: string;
  bidang_keahlian: string | null;
  max_mahasiswa_bimbingan: number;
}

export interface MataKuliah {
  id: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number | null;
  dosen_pengampu_id: string | null;
  kuota: number;
}

export interface KrsRow {
  id: string;
  mahasiswa_id: string;
  mata_kuliah_id: string;
  semester_aktif: string;
  status: KrsStatus;
  catatan: string | null;
  created_at?: string;
  mata_kuliah?: MataKuliah;
  mahasiswa?: Mahasiswa;
}

export interface KrsSummary {
  semester_aktif: string;
  total_sks_diajukan_disetujui: number;
  sks_by_status: Record<KrsStatus, number>;
  jumlah_item: number;
}
