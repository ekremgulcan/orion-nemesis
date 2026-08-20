import { apiClient } from "@/api/client"

export interface InvestorAccountOptionDto {
  id: number
  hesapNo: string
  customerId: number
  customerName: string
  yatirimciNo: number | null
  tcknVkn: string
  yatirimciDurumu: string | null
  musteriSiniflandirmasi: string | null
  nitelikliYatirimci: boolean
  durum: string
  hesapSinifi: string | null
}

export interface InvestorDto {
  id: number | null
  musteriNo: string | null
  adSoyadUnvan: string | null
  musteriTipi: string | null
  tcknVkn: string
  riskGrubu: string | null
  telefon: string | null
  email: string | null
  aktif: boolean
  yatirimciNo: number | null
  isim: string
  soyisim: string | null
  babaAdi: string | null
  cinsiyet: string | null
  dogumYeri: string | null
  dogumTarihi: string | null
  uyruk: string | null
  sube: string | null
  yatirimciLokasyonTipi: string | null
  vergiMukellefiyeti: string | null
  vergiNumarasi: string | null
  vergiDairesi: string | null
  yurtdisiVergiNumarasi: string | null
  yabanciVergiUlkesi: string | null
  musteriSiniflandirmasi: string | null
  ikinciYabanciVergiUlkesi: string | null
  greenCard: boolean
  ucuncuYabanciVergiUlkesi: string | null
  ikinciVknZorunluDegil: boolean
  webMailerRaporlari: boolean
  hesaplananYp: string | null
  kisininMeslegi: string | null
  musteriTanimiTipi: string | null
  mkkSicilNo: string | null
  takasbankSicilNo: string | null
  yatirimciTipi: string | null
  yatirimciDurumu: string | null
  ikinciVatandaslikUlkesi: string | null
  dogumUlkesi: string | null
  abdVergiMukellefi: boolean
  ikinciYurtdisiVergiNumarasi: string | null
  yabanciVknZorunluDegil: boolean
  ucuncuYurtdisiVergiNumarasi: string | null
  ucuncuVknZorunluDegil: boolean
  nitelikliYatirimci: boolean
  atananYp: string | null
  iysAramaIzni: string | null
  nitelikliYatirimciDusukTutar: boolean
  yatirimciProfili: string | null
  iysEpostaIzni: string | null
  interaktifKullanici: boolean
  yatirimciSegmenti: string | null
  iysSmsIzni: string | null
}

export interface InvestorIdentityDto {
  id: number | null
  seriNo: string | null
  medeniHali: string | null
  anneAdi: string | null
  verildigiYer: string | null
  verildigiTarih: string | null
  il: string | null
  ilce: string | null
  mahalleKoy: string | null
  ciltNo: string | null
  aileSiraNo: string | null
  siraNo: string | null
  sonGecerlilik: string | null
  esTckn: string | null
  surucuBelgeNo: string | null
  surucuSinif: string | null
  surucuVerilisTarih: string | null
  surucuGecerlilik: string | null
  pasaportNo: string | null
  pasaportVerilis: string | null
  pasaportGecerlilik: string | null
  pasaportYeri: string | null
}

export interface InvestorAccountDto {
  id: number | null
  hesapNo: string | null
  hesapTipi: string | null
  durum: string
  acilisTarihi: string | null
  hesapSinifi: string | null
  yatirimDanismani: string | null
  profilTanimi: string | null
  afkKodu: string | null
  mpfTipi: string | null
  altSube: string | null
  hesapMusteriTipi: string | null
  acenta: string | null
  hesapSube: string | null
  sikKullanilan: boolean
  ozelSozlesme: boolean
  portfoyHesabi: boolean
  kolokasyonHesabi: boolean
  viop: boolean
  webmailerEkstre: boolean
  lme: boolean
  ytmHisse: boolean
  ytmFon: boolean
  ytmViop: boolean
}

export interface InvestorSnapshotDto {
  customer: InvestorDto
  identity: InvestorIdentityDto
  hesaplar: InvestorAccountDto[]
  adresler: AddressDto[]
  iletisimler: ContactDto[]
  kanallar: ChannelDto[]
  belgeler: DocumentDto[]
  notlar: NoteDto[]
  disHesaplar: ExternalBankDto[]
  egitimler: EducationDto[]
  referanslar: ReferenceDto[]
  webmailer: WebmailerDto[]
  testler: SuitabilityDto[]
  disKullanicilar: ExternalUserDto[]
}

export interface AddressDto {
  id: number
  adresTipi: string
  ulke: string | null
  il: string | null
  ilce: string | null
  mahalle: string | null
  caddeSokak: string | null
  kapiNo: string | null
  postaKodu: string | null
  varsayilan: boolean
}

export interface ContactDto {
  id: number
  iletisimTipi: string
  deger: string
  varsayilan: boolean
}

export interface ChannelDto {
  id: number
  kanal: string
  yetkili: boolean
  durum: string
}

export interface DocumentDto {
  id: number
  dokumanTipi: string
  getirilisTarihi: string | null
  gecerlilikTarihi: string | null
  versiyon: string | null
  secili: boolean
}

export interface NoteDto {
  id: number
  notTipi: string
  notMetni: string
  guncellemeTarihi: string
}

export interface ExternalBankDto {
  id: number
  referansKurum: string | null
  subeAdi: string | null
  hesapNo: string | null
  iban: string | null
  paraBirimi: string | null
  gvtVar: boolean
  hesapSahibi: string | null
  hesapTipi: string | null
}

export interface EducationDto {
  id: number
  egitimDerecesi: string | null
  okul: string | null
  fakulte: string | null
  bolum: string | null
  mezuniyetTarihi: string | null
}

export interface ReferenceDto {
  id: number
  referansAdi: string | null
  referansTelefon: string | null
  referansKurum: string | null
  aciklama: string | null
}

export interface WebmailerDto {
  id: number
  uyeId: string | null
  raporAciklamasi: string
  eposta: string | null
  secili: boolean
}

export interface SuitabilityDto {
  id: number
  testTipi: string
  testTarihi: string | null
  testSonucu: string | null
}

export interface ExternalUserDto {
  id: number
  disSistem: string
  kullaniciKodu: string
}

export interface AccountExtrasDto {
  vekiller: ProxyDto[]
  ortaklar: PartnerDto[]
  komisyonlar: CommissionDto[]
  sozlesmeler: ContractDto[]
  hesapKanallari: ChannelDto[]
  gruplar: GroupDto[]
  saklama: CustodyDto[]
  kontroller: ControlDto[]
  raporlar: ReportingDto[]
  gizliHesaplar: HiddenDto[]
  turevKomisyonlari: DerivativeDto[]
}

export interface ProxyDto {
  id: number
  kimlikNo: string | null
  isim: string | null
  soyisim: string | null
  babaAdi: string | null
  uyruk: string | null
  vergiMukellefiyeti: string | null
  cinsiyet: string | null
  vekilTipi: string | null
}

export interface PartnerDto {
  id: number
  kimlikNo: string | null
  isim: string | null
  soyisim: string | null
  ortaklikPayi: number | null
  mkkSicilNo: string | null
  takasbankSicilNo: string | null
  yatirimciDurumu: string | null
}

export interface CommissionDto {
  id: number
  islem: string | null
  masrafAciklamasi: string | null
  parametreAdi: string | null
  paraBirimi: string | null
  piyasaAdi: string | null
  komisyonDegeri: number | null
}

export interface ContractDto {
  id: number
  hizmetTipi: string | null
  sozlesmeAdi: string | null
  getirilisTarihi: string | null
  versiyon: string | null
}

export interface GroupDto {
  id: number
  grupAdi: string
  aciklama: string | null
}

export interface CustodyDto {
  id: number
  saklamaci: string | null
  saklamaHesapNo: string | null
  paraBirimi: string | null
}

export interface ControlDto {
  id: number
  kontrolAdi: string
  kontrolDegeri: string | null
}

export interface ReportingDto {
  id: number
  raporTipi: string
  kanal: string | null
  aktif: boolean
}

export interface HiddenDto {
  id: number
  gizliHesapNo: string
  aciklama: string | null
}

export interface DerivativeDto {
  id: number
  islem: string | null
  komisyonDegeri: number | null
  paraBirimi: string | null
}

export async function fetchInvestorAccounts(): Promise<InvestorAccountOptionDto[]> {
  const { data } = await apiClient.get<InvestorAccountOptionDto[]>("/core/investors/accounts")
  return data
}

export async function fetchInvestorBlank(): Promise<InvestorSnapshotDto> {
  const { data } = await apiClient.get<InvestorSnapshotDto>("/core/investors/blank")
  return data
}

export async function fetchInvestorByAccount(accountId: number): Promise<InvestorSnapshotDto> {
  const { data } = await apiClient.get<InvestorSnapshotDto>(`/core/investors/by-account/${accountId}`)
  return data
}

export async function fetchInvestor(customerId: number): Promise<InvestorSnapshotDto> {
  const { data } = await apiClient.get<InvestorSnapshotDto>(`/core/investors/${customerId}`)
  return data
}

export async function saveInvestor(body: {
  customer: InvestorDto
  identity: InvestorIdentityDto
}): Promise<InvestorSnapshotDto> {
  const { data } = await apiClient.post<InvestorSnapshotDto>("/core/investors", body)
  return data
}

export async function saveInvestorAccount(customerId: number, body: InvestorAccountDto): Promise<InvestorAccountDto> {
  const { data } = await apiClient.post<InvestorAccountDto>(`/core/investors/${customerId}/accounts`, body)
  return data
}

export async function fetchAccountExtras(accountId: number): Promise<AccountExtrasDto> {
  const { data } = await apiClient.get<AccountExtrasDto>(`/core/investors/accounts/${accountId}/extras`)
  return data
}

export async function addInvestorAddress(customerId: number, body: Partial<AddressDto>): Promise<AddressDto> {
  const { data } = await apiClient.post<AddressDto>(`/core/investors/${customerId}/addresses`, body)
  return data
}

export async function addInvestorContact(customerId: number, body: Partial<ContactDto>): Promise<ContactDto> {
  const { data } = await apiClient.post<ContactDto>(`/core/investors/${customerId}/contacts`, body)
  return data
}

export async function addInvestorChannel(customerId: number, kanal: string): Promise<ChannelDto> {
  const { data } = await apiClient.post<ChannelDto>(`/core/investors/${customerId}/channels`, { kanal })
  return data
}

export async function saveInvestorDocuments(customerId: number, body: DocumentDto[]): Promise<void> {
  await apiClient.put(`/core/investors/${customerId}/documents`, body)
}

export async function addInvestorNote(customerId: number, notTipi: string, notMetni: string): Promise<NoteDto> {
  const { data } = await apiClient.post<NoteDto>(`/core/investors/${customerId}/notes`, { notTipi, notMetni })
  return data
}

export async function deleteInvestorNote(id: number): Promise<void> {
  await apiClient.delete(`/core/investors/notes/${id}`)
}

export async function addInvestorBank(customerId: number, body: Partial<ExternalBankDto>): Promise<ExternalBankDto> {
  const { data } = await apiClient.post<ExternalBankDto>(`/core/investors/${customerId}/external-banks`, body)
  return data
}

export async function addInvestorEducation(customerId: number, body: Partial<EducationDto>): Promise<EducationDto> {
  const { data } = await apiClient.post<EducationDto>(`/core/investors/${customerId}/education`, body)
  return data
}

export async function addInvestorReference(customerId: number, body: Partial<ReferenceDto>): Promise<ReferenceDto> {
  const { data } = await apiClient.post<ReferenceDto>(`/core/investors/${customerId}/references`, body)
  return data
}

export async function saveInvestorWebmailer(customerId: number, body: WebmailerDto[]): Promise<void> {
  await apiClient.put(`/core/investors/${customerId}/webmailer`, body)
}

export async function addInvestorTest(customerId: number, body: Partial<SuitabilityDto>): Promise<SuitabilityDto> {
  const { data } = await apiClient.post<SuitabilityDto>(`/core/investors/${customerId}/tests`, body)
  return data
}

export async function addInvestorExternalUser(customerId: number, body: Partial<ExternalUserDto>): Promise<ExternalUserDto> {
  const { data } = await apiClient.post<ExternalUserDto>(`/core/investors/${customerId}/external-user-ids`, body)
  return data
}

export async function addAccountProxy(accountId: number, body: Partial<ProxyDto>): Promise<ProxyDto> {
  const { data } = await apiClient.post<ProxyDto>(`/core/investors/accounts/${accountId}/proxies`, body)
  return data
}

export async function addAccountPartner(accountId: number, body: Partial<PartnerDto>): Promise<PartnerDto> {
  const { data } = await apiClient.post<PartnerDto>(`/core/investors/accounts/${accountId}/partners`, body)
  return data
}

export async function applyCommissionTemplate(accountId: number, deger: number): Promise<void> {
  await apiClient.post(`/core/investors/accounts/${accountId}/commissions/template`, { deger })
}

export async function addAccountContract(accountId: number, body: Partial<ContractDto>): Promise<ContractDto> {
  const { data } = await apiClient.post<ContractDto>(`/core/investors/accounts/${accountId}/contracts`, body)
  return data
}

export async function addAccountChannel(accountId: number, kanal: string): Promise<ChannelDto> {
  const { data } = await apiClient.post<ChannelDto>(`/core/investors/accounts/${accountId}/channels`, { kanal })
  return data
}

export async function addAccountGroup(accountId: number, grupAdi: string): Promise<GroupDto> {
  const { data } = await apiClient.post<GroupDto>(`/core/investors/accounts/${accountId}/groups`, { grupAdi })
  return data
}

export async function addAccountCustody(accountId: number, body: Partial<CustodyDto>): Promise<CustodyDto> {
  const { data } = await apiClient.post<CustodyDto>(`/core/investors/accounts/${accountId}/custody`, body)
  return data
}

export async function addAccountControl(accountId: number, body: Partial<ControlDto>): Promise<ControlDto> {
  const { data } = await apiClient.post<ControlDto>(`/core/investors/accounts/${accountId}/controls`, body)
  return data
}

export async function addAccountReporting(accountId: number, body: Partial<ReportingDto>): Promise<ReportingDto> {
  const { data } = await apiClient.post<ReportingDto>(`/core/investors/accounts/${accountId}/reporting`, body)
  return data
}

export async function addAccountHidden(accountId: number, gizliHesapNo: string): Promise<HiddenDto> {
  const { data } = await apiClient.post<HiddenDto>(`/core/investors/accounts/${accountId}/hidden`, { gizliHesapNo })
  return data
}

export async function addAccountDerivative(accountId: number, body: Partial<DerivativeDto>): Promise<DerivativeDto> {
  const { data } = await apiClient.post<DerivativeDto>(`/core/investors/accounts/${accountId}/derivatives`, body)
  return data
}
