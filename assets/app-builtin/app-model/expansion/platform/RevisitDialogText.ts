/** 礼包弹窗的可翻译文案，标题使用独立英文美术字。 */
const copy: Record<string, string[]> = {
    en: ['Sidebar Gift', 'Add to Home Screen', 'Find us in your TikTok sidebar!', 'Add a shortcut. Play anytime!', 'FREE SHUFFLE ×1', 'FREE REMOVE ×1', 'GO NOW', 'ADD NOW', 'CHECK & CLAIM', 'CLAIMED', 'Please wait…', 'Available in TikTok.'],
    zh: ['侧边栏礼包', '添加到桌面', '从 TikTok 个人主页侧边栏找到游戏！', '添加桌面快捷方式，随时回来玩！', '打乱道具 ×1', '消除道具 ×1', '前往完成', '添加到桌面', '检查并领取', '已领取', '请稍候…', '请在 TikTok 中完成此任务。'],
    ja: ['サイドバー特典', 'ホーム画面に追加', 'TikTokのサイドバーからゲームを開こう！', 'ショートカットを追加して、いつでもプレイ！', 'シャッフル ×1', '消去 ×1', '移動する', '追加する', '確認して受け取る', '受取済み', 'お待ちください…', 'TikTokで利用できます。'],
    id: ['Hadiah Sidebar', 'Tambah ke Layar Utama', 'Temukan kami di sidebar TikTok!', 'Tambah pintasan. Main kapan saja!', 'ACAK GRATIS ×1', 'HAPUS GRATIS ×1', 'BUKA', 'TAMBAHKAN', 'CEK & KLAIM', 'DIKLAIM', 'Tunggu…', 'Tersedia di TikTok.'],
    th: ['ของขวัญแถบข้าง', 'เพิ่มบนหน้าจอหลัก', 'พบเกมได้ในแถบข้าง TikTok!', 'เพิ่มทางลัด เล่นได้ทุกเมื่อ!', 'สับเปลี่ยนฟรี ×1', 'ลบฟรี ×1', 'ไปเลย', 'เพิ่มเลย', 'ตรวจสอบรางวัล', 'รับแล้ว', 'โปรดรอ…', 'ใช้งานได้ใน TikTok'],
    vi: ['Quà thanh bên', 'Thêm vào màn hình chính', 'Tìm trò chơi trong thanh bên TikTok!', 'Thêm lối tắt. Chơi bất cứ lúc nào!', 'TRỘN MIỄN PHÍ ×1', 'XÓA MIỄN PHÍ ×1', 'ĐI NGAY', 'THÊM NGAY', 'KIỂM TRA QUÀ', 'ĐÃ NHẬN', 'Vui lòng đợi…', 'Khả dụng trong TikTok.'],
    ms: ['Hadiah Sidebar', 'Tambah ke Skrin Utama', 'Cari kami di bar sisi TikTok!', 'Tambah pintasan. Main bila-bila masa!', 'SUSUN SEMULA PERCUMA ×1', 'BUANG PERCUMA ×1', 'PERGI', 'TAMBAH', 'SEMAK GANJARAN', 'DITUNTUT', 'Sila tunggu…', 'Tersedia dalam TikTok.'],
    fil: ['Regalo sa Sidebar', 'Idagdag sa Home Screen', 'Hanapin kami sa sidebar ng TikTok!', 'Magdagdag ng shortcut. Maglaro anumang oras!', 'LIBRENG BALASA ×1', 'LIBRENG ALIS ×1', 'PUMUNTA', 'IDAGDAG', 'TINGNAN ANG REWARD', 'NAKUHA NA', 'Sandali…', 'Available sa TikTok.'],
};

/** @param language 当前语言。 @param index 固定词条索引。 */
export function revisitDialogText(language: string, index: number): string {
    return (copy[language] || copy.en)[index] || copy.en[index] || '';
}
