// Mock issuers and institutions. Phase A uses these as if they came from the contract.
// Only the wallet address would live on chain. Name, role and department are frontend only.
// Every institution and person here is fictional.

export const ADMIN_ADDRESS = '0x71A3f4C9E2b7D5148aA0C36e91Bd472F5E8c093F'
export const ISSUER_ADDRESS = '0x9bC42D7Ae6F318905cE73b1D8fA602E4c17B5A8D'
export const STUDENT_ADDRESS = '0x3fD25B8c14E7a90D6b3F82Ce105A47dB9E60F2C1'

export const CONTRACT_ADDRESS = '0x5A9f83Cd21B7E406fA13c8D57e29B04a6C8F31E2'

export const mockInstitutions = [
  {
    id: 'tech-university',
    name: 'Tech University',
    shortName: 'TU',
    faculty: 'School of Computer Science',
  },
  {
    id: 'northbridge-university',
    name: 'Northbridge University',
    shortName: 'NBU',
    faculty: 'School of Design',
  },
  {
    id: 'meridian-institute',
    name: 'Meridian Institute',
    shortName: 'MI',
    faculty: 'Graduate School of Management',
  },
]

export const mockIssuers = [
  {
    address: ADMIN_ADDRESS,
    name: 'University Admin',
    role: 'Contract Admin',
    department: 'Office of the Registrar',
    institution: 'Tech University',
    active: true,
  },
  {
    address: ISSUER_ADDRESS,
    name: 'Tech University',
    role: 'Whitelisted Issuer',
    department: 'School of Computer Science',
    institution: 'Tech University',
    active: true,
  },
  {
    address: '0xC48eB1a5D7290F63b8E4a01Dc95F7382B6d1409A',
    name: 'Northbridge University',
    role: 'Whitelisted Issuer',
    department: 'School of Design',
    institution: 'Northbridge University',
    active: true,
  },
  {
    address: '0xE07d9F3b6C2145aD8e05B7f4901Ac6382D5B7e14',
    name: 'Meridian Institute',
    role: 'Whitelisted Issuer',
    department: 'Graduate School of Management',
    institution: 'Meridian Institute',
    active: true,
  },
]

export const mockStudents = [
  {
    name: 'Aarav Sharma',
    studentId: 'TU2022CS104',
    address: STUDENT_ADDRESS,
  },
  {
    name: 'Priya Mehta',
    studentId: 'NBU2021DS027',
    address: '0x8Ba14C6e5D02937fA4c81B7e6390D5aF27C4E1b6',
  },
  {
    name: 'Rohan Iyer',
    studentId: 'MI2023PG091',
    address: '0x2Cd60F81b74A395eD1f8B0c26a49E735Bc0aD4f9',
  },
]

// Who signs the printed certificate. Frontend only, fictional people.
const SIGNATORIES = {
  'Tech University': {
    registrar: 'Dr. Neha Kulkarni',
    registrarRole: 'Registrar',
    dean: 'Prof. Arjun Rao',
    deanRole: 'Dean of Academics',
    faculty: 'School of Computer Science',
  },
  'Northbridge University': {
    registrar: 'Dr. Meera Iyer',
    registrarRole: 'Registrar',
    dean: 'Prof. Samuel Ortiz',
    deanRole: 'Dean of Design',
    faculty: 'School of Design',
  },
  'Meridian Institute': {
    registrar: 'Dr. Kavita Menon',
    registrarRole: 'Registrar',
    dean: 'Prof. Daniel Roy',
    deanRole: 'Dean of Graduate Studies',
    faculty: 'Graduate School of Management',
  },
}

const DEFAULT_SIGNATORIES = {
  registrar: 'Office of the Registrar',
  registrarRole: 'Registrar',
  dean: 'Office of Academics',
  deanRole: 'Dean of Academics',
  faculty: 'Office of the Registrar',
}

export function getSignatories(institution) {
  return SIGNATORIES[institution] || DEFAULT_SIGNATORIES
}

export function getIssuerByAddress(address) {
  if (!address) return null
  const lower = address.toLowerCase()
  return mockIssuers.find((i) => i.address.toLowerCase() === lower) || null
}

export function getStudentByAddress(address) {
  if (!address) return null
  const lower = address.toLowerCase()
  return mockStudents.find((s) => s.address.toLowerCase() === lower) || null
}
