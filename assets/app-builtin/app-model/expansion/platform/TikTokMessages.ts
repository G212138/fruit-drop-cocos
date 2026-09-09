/** 平台入口文字独立于美术素材；顺序为桌面、主页、登录不可用、失败、已领取、已发奖、回访提示。 */
const messages: Record<string, string[]> = {
    en: ['Home shortcut\n+1 Remove','Profile revisit\n+1 Shuffle','Login is not available yet. Please try again later.','Unavailable. Please try again later.','Reward already claimed.','Reward received!','Return using this entry to claim your reward.'],
    ja: ['ホームに追加\n消去 +1','プロフィールから再訪\nシャッフル +1','ログインはまだ利用できません。後でもう一度お試しください。','利用できません。後でもう一度お試しください。','報酬は受取済みです。','報酬を受け取りました！','この入口から戻って報酬を受け取りましょう。'],
    id: ['Pintasan beranda\nHapus +1','Kembali via profil\nAcak +1','Login belum tersedia. Coba lagi nanti.','Belum tersedia. Coba lagi nanti.','Hadiah sudah diklaim.','Hadiah diterima!','Kembali melalui pintasan ini untuk mengklaim hadiah.'],
    th: ['เพิ่มทางลัด\nลบ +1','กลับจากโปรไฟล์\nสับเปลี่ยน +1','ยังเข้าสู่ระบบไม่ได้ โปรดลองใหม่ภายหลัง','ยังใช้งานไม่ได้ โปรดลองใหม่ภายหลัง','รับรางวัลไปแล้ว','ได้รับรางวัลแล้ว!','กลับเข้าจากทางลัดนี้เพื่อรับรางวัล'],
    vi: ['Thêm lối tắt\nXóa +1','Quay lại từ hồ sơ\nTrộn +1','Chưa thể đăng nhập. Vui lòng thử lại sau.','Chưa khả dụng. Vui lòng thử lại sau.','Đã nhận phần thưởng.','Đã nhận thưởng!','Quay lại qua lối vào này để nhận thưởng.'],
    ms: ['Pintasan utama\nBuang +1','Kembali dari profil\nKocok +1','Log masuk belum tersedia. Cuba lagi nanti.','Belum tersedia. Cuba lagi nanti.','Ganjaran sudah dituntut.','Ganjaran diterima!','Kembali melalui pintasan ini untuk menuntut ganjaran.'],
    fil: ['Shortcut sa home\nAlisin +1','Bumalik sa profile\nPaghaluin +1','Hindi pa available ang login. Subukan muli mamaya.','Hindi available. Subukan muli mamaya.','Nakuha na ang reward.','Natanggap ang reward!','Bumalik gamit ang entry na ito para makuha ang reward.'],
    zh: ['添加到桌面\n消除道具 +1','从个人主页回访\n刷新道具 +1','登录暂不可用，请稍后重试。','暂时不可用，请稍后重试。','此奖励已领取。','奖励已到账！','请从此入口回到游戏领取奖励。'],
};

/** @param language 当前已解析语言码。 @param index 平台词条序号，按表头固定顺序。 */
export function tikTokText(language: string, index: number): string {
    return (messages[language] || messages.en)[index] || messages.en[3];
}
