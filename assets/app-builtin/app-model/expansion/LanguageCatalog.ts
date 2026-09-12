/** 首批发行语言；system 为跟随设备，存档使用稳定代码。 */
export const languageOptions = ['system', 'en', 'ja', 'id', 'th', 'vi', 'ms', 'fil', 'zh'] as const;
/** 玩家可保存的语言选择。 */
export type LanguageChoice = typeof languageOptions[number];
/** 语言选择器使用各语言自称，方便切错语言后恢复。 */
export const languageNames: Record<string, string> = {
    en: 'English', ja: '日本語', id: 'Bahasa Indonesia', th: 'ไทย',
    vi: 'Tiếng Việt', ms: 'Bahasa Melayu', fil: 'Filipino', zh: '简体中文',
};
/** 玩家可见基础词条；按钮文字不烘焙进图片。 */
const english = {
    play: 'PLAY', themes: 'THEMES', level: 'Level {level}', editor: 'Level Editor',
    settings: 'Settings', music: 'Music', sound: 'Sound', vibrate: 'Vibration',
    language: 'Language', system: 'System default', on: 'ON', off: 'OFF',
    continue: 'Continue', home: 'Home', restart: 'Retry', close: 'Close',
    remaining: 'Left', eliminate: 'Remove', shuffle: 'Shuffle', unlock: 'Unlock',
    next: 'Next', revive: 'Revive', unlocked: 'Unlocked!', fruits: 'Fruit', sweets: 'Sweets',
    selected: 'Selected', themeLocked: 'Clear 30 levels to unlock', saveError: 'Could not save language. Your choice applies for this session.',
    shake: 'Shake',
    collection: 'COLLECTION', dailyGift: 'DAILY GIFT', leaderboard: 'RANK', comingSoon: 'Coming soon',
    allFruitCleared: 'ALL FRUIT CLEARED', clearChute: 'Clear the chute and keep playing',
    watchAd: 'WATCH AD', noThanks: 'NO THANKS', giveAnotherTry: 'Give it another try!', tryAgain: 'TRY AGAIN',
    paused: 'PAUSED', privacyPolicy: 'Privacy Policy', termsOfUse: 'Terms of Use',
};
/** 译文键，以英文表为结构基准。 */
export type LanguageKey = keyof typeof english;
/** 各语言完整基础词条，与英文按同一顺序校验。 */
const rows: Record<string, string[]> = {
    ja: ['プレイ','テーマ','レベル {level}','レベルエディター','設定','音楽','効果音','振動','言語','端末の設定に従う','オン','オフ','続ける','ホーム','もう一度','閉じる','残り','消去','シャッフル','解除','次へ','復活','アンロック！','フルーツ','スイーツ','選択中','30レベルクリアで解放','言語を保存できません。今回のみ適用されます。'],
    id: ['MAIN','TEMA','Level {level}','Editor Level','Pengaturan','Musik','Suara','Getaran','Bahasa','Ikuti sistem','AKTIF','NONAKTIF','Lanjut','Beranda','Coba lagi','Tutup','Sisa','Hapus','Acak','Buka','Berikutnya','Bangkit','Terbuka!','Buah','Manisan','Dipilih','Selesaikan 30 level untuk membuka','Bahasa gagal disimpan. Pilihan berlaku untuk sesi ini.'],
    th: ['เล่น','ธีม','ด่าน {level}','แก้ไขด่าน','ตั้งค่า','เพลง','เสียง','การสั่น','ภาษา','ตามระบบ','เปิด','ปิด','เล่นต่อ','หน้าหลัก','ลองใหม่','ปิด','เหลือ','ลบ','สับเปลี่ยน','ปลดล็อก','ถัดไป','คืนชีพ','ปลดล็อกแล้ว!','ผลไม้','ขนม','เลือกแล้ว','ผ่าน 30 ด่านเพื่อปลดล็อก','บันทึกภาษาไม่ได้ การเลือกนี้ใช้ได้เฉพาะครั้งนี้'],
    vi: ['CHƠI','CHỦ ĐỀ','Màn {level}','Chỉnh sửa màn','Cài đặt','Nhạc','Âm thanh','Rung','Ngôn ngữ','Theo hệ thống','BẬT','TẮT','Tiếp tục','Trang chủ','Thử lại','Đóng','Còn lại','Xóa','Trộn','Mở khóa','Tiếp theo','Hồi sinh','Đã mở khóa!','Trái cây','Đồ ngọt','Đã chọn','Hoàn thành 30 màn để mở khóa','Không lưu được ngôn ngữ. Lựa chọn chỉ áp dụng trong phiên này.'],
    ms: ['MAIN','TEMA','Tahap {level}','Editor Tahap','Tetapan','Muzik','Bunyi','Getaran','Bahasa','Ikut sistem','HIDUP','MATI','Teruskan','Laman utama','Cuba lagi','Tutup','Baki','Buang','Kocok','Buka','Seterusnya','Hidup semula','Dibuka!','Buah','Manisan','Dipilih','Selesaikan 30 tahap untuk membuka','Bahasa tidak dapat disimpan. Pilihan digunakan untuk sesi ini.'],
    fil: ['MAGLARO','MGA TEMA','Antas {level}','Editor ng Antas','Mga Setting','Musika','Tunog','Panginginig','Wika','Sundin ang system','BUKAS','PATAY','Magpatuloy','Home','Subukan muli','Isara','Natitira','Alisin','Paghaluin','I-unlock','Susunod','Buhayin','Na-unlock!','Prutas','Matatamis','Napili','Tapusin ang 30 antas para ma-unlock','Hindi na-save ang wika. Para lang sa sesyong ito ang pinili.'],
    zh: ['开始游戏','主题','第 {level} 关','关卡编辑器','设置','音乐','音效','振动','语言','跟随系统','开','关','继续游戏','返回首页','重新挑战','关闭','剩余','消除','刷新','解锁','下一关','复活','恭喜解锁！','水果','甜品','已使用','通关30关后可使用','语言暂时无法保存，本次会话仍然生效。'],
};
/** 每种语言的基础词条，缺项在开发检查中直接报错。 */
export const languageMessages: Record<string, Record<LanguageKey, string>> = { en: english };
/** 解卡按钮译文，使用已有语言键体系，不把文字写入图片。 */
const shakeLabels: Record<string, string> = {
    ja: 'ゆらす', id: 'Goyang', th: 'เขย่า', vi: 'Lắc', ms: 'Goncang', fil: 'Alugin', zh: '晃一晃',
};
/** 新首页、设置及结算界面的补充译文，标题图片固定为英文，不进入词表。 */
const extendedLabels: Record<string, string[]> = {
    ja: ['コレクション','デイリーギフト','ランキング','近日公開','フルーツをすべて消しました','シュートを空けて続けよう','広告を見る','やめる','もう一度挑戦しよう！','もう一度','一時停止','プライバシーポリシー','利用規約'],
    id: ['KOLEKSI','HADIAH HARIAN','PERINGKAT','Segera hadir','SEMUA BUAH BERSIH','Kosongkan jalur dan lanjut bermain','TONTON IKLAN','TIDAK, TERIMA KASIH','Coba sekali lagi!','COBA LAGI','DIJEDA','Kebijakan Privasi','Ketentuan Penggunaan'],
    th: ['คอลเลกชัน','ของขวัญรายวัน','อันดับ','เร็ว ๆ นี้','เก็บผลไม้ครบแล้ว','เคลียร์ช่องแล้วเล่นต่อ','ดูโฆษณา','ไม่ ขอบคุณ','ลองอีกครั้ง!','ลองใหม่','หยุดชั่วคราว','นโยบายความเป็นส่วนตัว','ข้อกำหนดการใช้งาน'],
    vi: ['BỘ SƯU TẬP','QUÀ HẰNG NGÀY','XẾP HẠNG','Sắp ra mắt','ĐÃ DỌN HẾT TRÁI CÂY','Dọn máng và chơi tiếp','XEM QUẢNG CÁO','KHÔNG, CẢM ƠN','Thử lại lần nữa!','THỬ LẠI','TẠM DỪNG','Chính sách quyền riêng tư','Điều khoản sử dụng'],
    ms: ['KOLEKSI','HADIAH HARIAN','KEDUDUKAN','Akan datang','SEMUA BUAH DIKOSONGKAN','Kosongkan laluan dan terus bermain','TONTON IKLAN','TIDAK, TERIMA KASIH','Cuba sekali lagi!','CUBA LAGI','DIJEDA','Dasar Privasi','Terma Penggunaan'],
    fil: ['KOLEKSYON','ARAW-ARAW NA REGALO','RANGGO','Malapit na','NALINIS NA ANG LAHAT NG PRUTAS','Linisin ang lagusan at magpatuloy','MANOOD NG AD','HINDI, SALAMAT','Subukan muli!','SUBUKAN MULI','NAKA-PAUSE','Patakaran sa Privacy','Mga Tuntunin ng Paggamit'],
    zh: ['图鉴','每日礼物','排行','即将开放','水果已全部清除','清理洞口并继续游戏','观看广告','不用了','再试一次吧！','重新挑战','暂停','隐私政策','使用条款'],
};
for (const code of Object.keys(rows)) {
    const values = rows[code].concat(shakeLabels[code], extendedLabels[code]);
    const keys = Object.keys(english) as LanguageKey[];
    if (values.length !== keys.length) throw new Error('语言词条数量不一致：' + code);
    const translated = {} as Record<LanguageKey, string>;
    keys.forEach((key, i) => { translated[key] = values[i]; });
    languageMessages[code] = translated;
}
/** @param code 系统完整语言码；兼容旧印尼码 in 与 Tagalog 的 tl，未知语言回退英语。 */
export function resolveLanguage(code: string): string {
    const base = (code || 'en').toLowerCase().split(/[-_]/)[0];
    const normalized = base === 'in' ? 'id' : base === 'tl' ? 'fil' : base;
    return languageMessages[normalized] ? normalized : 'en';
}
/** @param code 当前语言。 @param key 文案键。 @param values 命名参数，避免拼接不同语言语序。 */
export function languageText(code: string, key: LanguageKey, values: Record<string, string | number> = {}): string {
    return languageMessages[resolveLanguage(code)][key].replace(/\{(\w+)\}/g, (whole, name) => String(values[name] ?? whole));
}
