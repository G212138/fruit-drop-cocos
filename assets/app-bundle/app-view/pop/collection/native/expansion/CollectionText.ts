/** 各语言物品名称按现有水果1—30、甜点1—30素材顺序排列。 */
const itemNames: Record<string, string[]> = {
 zh: '梨|白草莓|橙子|蜜瓜|李子|苹果|火龙果|蓝莓|莲雾|榴莲|雪梨|芒果|猕猴桃|柚子|木瓜|柠檬|杏子|葡萄|橘子|青柠|青苹果|人参果|山竹|柿子|释迦|覆盆子|桃子|西瓜|香蕉|杨梅|圆面包|樱花布丁|草莓挞|抹茶卷|草莓蛋糕|糖霜甜甜圈|吐司|奶油挞|蓝莓慕斯|果冻|焦糖蛋挞|巧克力圈|焦糖蛋糕|马卡龙|蓝莓挞|奶油泡芙|纸杯蛋糕|奶油卷|提拉米苏|柠檬蛋糕|巧克力蛋糕|焦糖布丁|抹茶挞|马卡龙挞|巧克力慕斯|莓果夏洛特|草莓慕斯|芒果蛋糕|草莓小蛋糕|蓝莓蛋糕'.split('|'),
 en: 'Pear|White Strawberry|Orange|Melon|Plum|Apple|Dragon Fruit|Blueberry|Wax Apple|Durian|Asian Pear|Mango|Kiwi|Pomelo|Papaya|Lemon|Apricot|Grapes|Mandarin|Lime|Green Apple|Pepino|Mangosteen|Persimmon|Sugar Apple|Raspberry|Peach|Watermelon|Banana|Chinese Bayberry|Bread Roll|Sakura Pudding|Strawberry Tart|Matcha Roll|Strawberry Cake|Glazed Donut|Toast|Cream Tart|Blueberry Mousse|Jelly|Caramel Egg Tart|Chocolate Donut|Caramel Cake|Macaron|Blueberry Tart|Cream Puff|Cupcake|Cream Roll|Tiramisu|Lemon Cake|Chocolate Cake|Caramel Pudding|Matcha Tart|Macaron Tart|Chocolate Mousse|Berry Charlotte|Strawberry Mousse|Mango Cake|Mini Strawberry Cake|Blueberry Cake'.split('|'),
 ja: '洋梨|白いイチゴ|オレンジ|メロン|プラム|リンゴ|ドラゴンフルーツ|ブルーベリー|レンブ|ドリアン|梨|マンゴー|キウイ|ポメロ|パパイヤ|レモン|アンズ|ブドウ|ミカン|ライム|青リンゴ|ペピーノ|マンゴスチン|柿|バンレイシ|ラズベリー|桃|スイカ|バナナ|ヤマモモ|丸パン|桜プリン|イチゴタルト|抹茶ロール|イチゴケーキ|ドーナツ|食パン|クリームタルト|ブルーベリームース|ゼリー|キャラメルエッグタルト|チョコドーナツ|キャラメルケーキ|マカロン|ブルーベリータルト|シュークリーム|カップケーキ|クリームロール|ティラミス|レモンケーキ|チョコケーキ|キャラメルプリン|抹茶タルト|マカロンタルト|チョコムース|ベリーシャルロット|イチゴムース|マンゴーケーキ|ミニイチゴケーキ|ブルーベリーケーキ'.split('|'),
 id: 'Pir|Stroberi Putih|Jeruk|Melon|Plum|Apel|Buah Naga|Blueberry|Jambu Air|Durian|Pir Asia|Mangga|Kiwi|Jeruk Bali|Pepaya|Lemon|Aprikot|Anggur|Jeruk Mandarin|Jeruk Nipis|Apel Hijau|Pepino|Manggis|Kesemek|Srikaya|Raspberry|Persik|Semangka|Pisang|Yangmei|Roti Bulat|Puding Sakura|Tart Stroberi|Gulung Matcha|Kue Stroberi|Donat Gula|Roti Tawar|Tart Krim|Mousse Blueberry|Jeli|Tart Karamel|Donat Cokelat|Kue Karamel|Makaron|Tart Blueberry|Sus Krim|Cupcake|Gulung Krim|Tiramisu|Kue Lemon|Kue Cokelat|Puding Karamel|Tart Matcha|Tart Makaron|Mousse Cokelat|Charlotte Beri|Mousse Stroberi|Kue Mangga|Kue Mini Stroberi|Kue Blueberry'.split('|'),
 th: 'ลูกแพร์|สตรอว์เบอร์รีขาว|ส้ม|เมลอน|พลัม|แอปเปิล|แก้วมังกร|บลูเบอร์รี|ชมพู่|ทุเรียน|สาลี่|มะม่วง|กีวี|ส้มโอ|มะละกอ|เลมอน|แอปริคอต|องุ่น|ส้มแมนดาริน|มะนาว|แอปเปิลเขียว|เปปิโน|มังคุด|ลูกพลับ|น้อยหน่า|ราสป์เบอร์รี|พีช|แตงโม|กล้วย|หยางเหมย|ขนมปังก้อน|พุดดิ้งซากุระ|ทาร์ตสตรอว์เบอร์รี|โรลมัทฉะ|เค้กสตรอว์เบอร์รี|โดนัทน้ำตาล|ขนมปังแถว|ทาร์ตครีม|มูสบลูเบอร์รี|เยลลี|ทาร์ตคาราเมล|โดนัทช็อกโกแลต|เค้กคาราเมล|มาการอง|ทาร์ตบลูเบอร์รี|ชูครีม|คัพเค้ก|โรลครีม|ทีรามิสุ|เค้กเลมอน|เค้กช็อกโกแลต|พุดดิ้งคาราเมล|ทาร์ตมัทฉะ|ทาร์ตมาการอง|มูสช็อกโกแลต|ชาร์ล็อตเบอร์รี|มูสสตรอว์เบอร์รี|เค้กมะม่วง|มินิเค้กสตรอว์เบอร์รี|เค้กบลูเบอร์รี'.split('|'),
 vi: 'Lê|Dâu Tây Trắng|Cam|Dưa Lưới|Mận|Táo|Thanh Long|Việt Quất|Roi|Sầu Riêng|Lê Á Đông|Xoài|Kiwi|Bưởi|Đu Đủ|Chanh Vàng|Mơ|Nho|Quýt|Chanh Xanh|Táo Xanh|Dưa Pepino|Măng Cụt|Hồng|Na|Mâm Xôi|Đào|Dưa Hấu|Chuối|Dương Mai|Bánh Mì Tròn|Pudding Sakura|Tart Dâu|Cuộn Matcha|Bánh Dâu|Donut Đường|Bánh Mì Gối|Tart Kem|Mousse Việt Quất|Thạch|Tart Caramel|Donut Sô Cô La|Bánh Caramel|Macaron|Tart Việt Quất|Bánh Su Kem|Cupcake|Bánh Cuộn Kem|Tiramisu|Bánh Chanh|Bánh Sô Cô La|Pudding Caramel|Tart Matcha|Tart Macaron|Mousse Sô Cô La|Charlotte Quả Mọng|Mousse Dâu|Bánh Xoài|Bánh Dâu Nhỏ|Bánh Việt Quất'.split('|'),
 ms: 'Pir|Strawberi Putih|Oren|Melon|Plum|Epal|Buah Naga|Beri Biru|Jambu Air|Durian|Pir Asia|Mangga|Kiwi|Limau Bali|Betik|Lemon|Aprikot|Anggur|Limau Mandarin|Limau Nipis|Epal Hijau|Pepino|Manggis|Kesemak|Buah Nona|Raspberi|Pic|Tembikai|Pisang|Yangmei|Roti Bulat|Puding Sakura|Tart Strawberi|Gulung Matcha|Kek Strawberi|Donat Gula|Roti Putih|Tart Krim|Mousse Beri Biru|Jeli|Tart Karamel|Donat Coklat|Kek Karamel|Makaron|Tart Beri Biru|Paf Krim|Kek Cawan|Gulung Krim|Tiramisu|Kek Lemon|Kek Coklat|Puding Karamel|Tart Matcha|Tart Makaron|Mousse Coklat|Charlotte Beri|Mousse Strawberi|Kek Mangga|Kek Strawberi Mini|Kek Beri Biru'.split('|'),
 fil: 'Peras|Puting Strawberry|Kahel|Melon|Plum|Mansanas|Dragon Fruit|Blueberry|Makopa|Durian|Peras Asyano|Mangga|Kiwi|Suha|Papaya|Lemon|Aprikot|Ubas|Mandarin|Dayap|Berdeng Mansanas|Pepino|Mangosteen|Persimon|Atis|Raspberry|Peach|Pakwan|Saging|Yangmei|Bilog na Tinapay|Sakura Pudding|Strawberry Tart|Matcha Roll|Strawberry Cake|Glazed Donut|Tinapay|Cream Tart|Blueberry Mousse|Gulaman|Caramel Egg Tart|Tsokolateng Donut|Caramel Cake|Macaron|Blueberry Tart|Cream Puff|Cupcake|Cream Roll|Tiramisu|Lemon Cake|Tsokolateng Cake|Caramel Pudding|Matcha Tart|Macaron Tart|Tsokolateng Mousse|Berry Charlotte|Strawberry Mousse|Mango Cake|Mini Strawberry Cake|Blueberry Cake'.split('|'),
};
/** 图鉴独有状态文案，顺序为未解锁、收集数、使用按钮、整组解锁门槛。 */
const labels: Record<string, string[]> = {
 zh: ['未解锁','已收集 {count} / 30','使用这组','全部解锁后可使用'],
 en: ['Locked','Collected {count} / 30','Use this set','Unlock all to use'],
 ja: ['未解放','収集 {count} / 30','このセットを使う','全て解放すると使用可能'],
 id: ['Terkunci','Terkumpul {count} / 30','Gunakan Set Ini','Buka semua untuk memakai'],
 th: ['ยังไม่ปลดล็อก','สะสม {count} / 30','ใช้ชุดนี้','ปลดล็อกทั้งหมดเพื่อใช้'],
 vi: ['Chưa mở','Đã sưu tầm {count} / 30','Dùng bộ này','Mở tất cả để sử dụng'],
 ms: ['Terkunci','Dikumpul {count} / 30','Gunakan Set Ini','Buka semua untuk guna'],
 fil: ['Naka-lock','Nakolekta {count} / 30','Gamitin ang set','I-unlock lahat para gamitin'],
};
/** @param language 已解析的语言。 @param index 原素材编号的零起始索引。 */
export function collectionName(language: string, index: number): string {
    return (itemNames[language] || itemNames.en)[index] || '';
}
/** @param language 当前语言。 @param key 状态索引。 @param count 已收集数量。 */
export function collectionText(language: string, key: number, count = 0): string {
    return (labels[language] || labels.en)[key].replace('{count}', String(count));
}
