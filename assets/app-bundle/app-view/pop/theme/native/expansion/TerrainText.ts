import { GameLanguage } from '../../../../../../app-builtin/app-model/expansion/GameLanguage';
import { terrainCatalog } from '../../../../../../app-builtin/app-model/expansion/TerrainProgress';
/** 主题网格独立译文，保持按钮和状态文本可本地化。 */
const labels: Record<string, string[]> = {
 en:['Watch {count}/2','Use','In use','Watching…','Ad unavailable. Try again later.','Finish watching the ad to count toward unlocking.','Completed {count}/2','Unlocked! Tap Use to apply.','Could not save. Please retry.'],
 zh:['解锁 {count}/2','使用','使用中','观看中…','广告暂不可用，请稍后重试','完整观看广告后才计入解锁次数','已完成 {count}/2','已解锁，点击使用即可切换','保存失败，请重试'],
 ja:['解放 {count}/2','使用','使用中','視聴中…','広告を利用できません。後でお試しください','最後まで視聴すると回数に加算されます','完了 {count}/2','解放しました。使用を選んでください','保存できませんでした。再試行してください'],
 id:['Buka {count}/2','Gunakan','Dipakai','Menonton…','Iklan tidak tersedia. Coba lagi nanti.','Tonton iklan sampai selesai agar dihitung untuk membuka tema.','Selesai {count}/2','Terbuka! Pilih Gunakan.','Gagal menyimpan. Coba lagi.'],
 th:['ปลดล็อก {count}/2','ใช้','ใช้อยู่','กำลังดู…','โฆษณาไม่พร้อม โปรดลองภายหลัง','ดูโฆษณาจนจบจึงจะนับเป็นความคืบหน้าในการปลดล็อก','สำเร็จ {count}/2','ปลดล็อกแล้ว แตะใช้','บันทึกไม่สำเร็จ โปรดลองอีกครั้ง'],
 vi:['Mở {count}/2','Dùng','Đang dùng','Đang xem…','Quảng cáo chưa sẵn sàng. Thử lại sau.','Xem hết quảng cáo để được tính vào tiến độ mở khóa.','Hoàn thành {count}/2','Đã mở! Chọn Dùng.','Không lưu được. Hãy thử lại.'],
 ms:['Buka {count}/2','Gunakan','Digunakan','Menonton…','Iklan tidak tersedia. Cuba lagi nanti.','Tonton iklan hingga tamat supaya dikira untuk membuka tema.','Selesai {count}/2','Dibuka! Pilih Gunakan.','Gagal menyimpan. Cuba lagi.'],
 fil:['Buksan {count}/2','Gamitin','Ginagamit','Nanonood…','Walang ad ngayon. Subukan mamaya.','Tapusin ang ad para madagdagan ang progreso sa pag-unlock.','Natapos {count}/2','Na-unlock! Piliin ang Gamitin.','Hindi na-save. Subukan muli.'],
};
/** 非中英语言的地块名称，顺序与稳定目录一致。 */
const names: Record<string, string[]> = {
 ja:['陽だまりの草原','クリームビスケットの谷','海辺の砂丘','冬の雪原','苔の森','赤岩の峡谷','青氷の裂け目','古木の洞','クリームケーキ','溶岩ドラゴン','オーロラドラゴン'],
 id:['Padang Padang Rumput Cerah','Biskuit Krim','Bukit Pasir','Salju Musim Dingin','Hutan Lumut','Ngarai Merah','Gletser Biru','Pohon Kuno','Kue Krim','Naga Lava','Naga Aurora'],
 th:['ทุ่งหญ้าแดดใส','บิสกิตครีม','เนินทรายชายฝั่ง','หิมะฤดูหนาว','ป่ามอส','หุบผาแดง','ธารน้ำแข็งฟ้า','โพรงไม้โบราณ','เค้กครีม','มังกรลาวา','มังกรออโรรา'],
 vi:['Đồi Cỏ Nắng','Bánh Quy Kem','Cồn Cát Biển','Dốc Tuyết','Rừng Rêu','Hẻm Núi Đỏ','Sông Băng Xanh','Hốc Cây Cổ','Bánh Kem','Rồng Dung Nham','Rồng Cực Quang'],
 ms:['Padang Rumput Cerah','Biskut Krim','Bukit Pasir','Salji Musim Sejuk','Hutan Lumut','Ngarai Merah','Rekahan Ais Biru','Pokok Purba','Kek Krim','Naga Lava','Naga Aurora'],
 fil:['Maaraw na Parang','Biskwit at Krema','Buhangin sa Baybay','Niyebeng Taglamig','Gubat ng Lumot','Pulang Kanyon','Asul na Yelo','Sinaunang Puno','Cake na Krema','Dragon ng Lava','Dragon ng Aurora'],
};
/** 译文语义编号，统一替换次数参数。 */
export type TerrainMessage = 'unlock' | 'use' | 'used' | 'busy' | 'unavailable' | 'cancelled' | 'progress' | 'unlocked' | 'saveError';
/** @param key 状态语义。 @param count 已完成广告次数。 */
export function terrainText(key: TerrainMessage, count = 0): string {
 const keys: TerrainMessage[] = ['unlock','use','used','busy','unavailable','cancelled','progress','unlocked','saveError'];
 return (labels[GameLanguage.current] || labels.en)[keys.indexOf(key)].replace('{count}',String(count));
}
/** @param index 地块目录下标。 */
export function terrainName(index: number): string {
 return names[GameLanguage.current]?.[index] || (GameLanguage.current === 'zh' ? terrainCatalog[index].zh : terrainCatalog[index].en);
}
