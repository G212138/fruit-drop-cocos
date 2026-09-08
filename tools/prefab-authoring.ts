// @ts-nocheck
import * as cc from 'cc';
const EDITOR = typeof Editor !== 'undefined';
/** 从原始场景和水果预制体只读提取的设计尺寸与多边形，单位像素。 */
const sourceGeometry = {"fruits":[{"kind":1,"width":83,"height":90,"points":[[-4.25,43.94],[-6.46,42.58],[-13.15,41.88],[-19.59,36.18],[-28.2,24.55],[-32.4,17.2],[-38.2,5.8],[-39.5,-0.5],[-40.4,-8.3],[-39.358,-18.138],[-33.6,-30.5],[-25.23,-38.34],[-18.01,-43.03],[13.35,-43.47],[24.01,-39.25],[33.65,-30.42],[39.65,-15.91],[39.5,2.5],[30.1,22.18],[25.17,28.16],[21.03,33.44],[14.49,41.23],[8.115,43.885],[6.68,43.47]],"offset":[0,0]},{"kind":2,"width":83,"height":92,"points":[[-2.5,34],[-23.5,35],[-28.5,39],[-28.5,33],[-20.5,28],[-31.5,28],[-31.5,25],[-34.82,21.17],[-39.49,12.39],[-41.39,1.52],[-39.44,-10.82],[-35.6,-20.9],[-30.08,-27.29],[-25.1,-33.74],[-18.2,-39.17],[-8.51,-43.68],[-0.39,-46.25],[7.55,-44.98],[21.8,-35.9],[29.98,-27.29],[36.96,-17],[41.5,-7],[40.23,9.91],[37.52,17.62],[31.74,24.62],[26.5,30],[30.5,32],[31.5,38],[29.5,38],[26.5,34],[17.5,34],[5.5,36],[2.5,34]],"offset":[0,0]},{"kind":3,"width":86,"height":85,"points":[[-9.28,41.24],[-25.88,33.59],[-34.1,25.8],[-41.948,8.147],[-43,-1.72],[-41.62,-8.5],[-40,-18.5],[-34.81,-25.08],[-30.51,-30.35],[-24.95,-34.8],[-14,-40.52],[10,-42.5],[17,-39.82],[28.51,-32.43],[38.03,-21.11],[43,-10.5],[43,10.5],[35.95,23.94],[25.51,34.73],[13,41.5]],"offset":[0,0]},{"kind":4,"width":85,"height":87,"points":[[-2.5,40.5],[-13.5,39.5],[-27.5,32.5],[-34.5,25.5],[-42.5,7.5],[-42.5,-10.5],[-39.2,-17.15],[-32.43,-29.01],[-20.62,-38.23],[-10,-42.28],[11.61,-42.28],[25.55,-35.49],[34.38,-26.85],[41.43,-11.5],[42.5,7.5],[36.24,20.8],[27.01,31.73],[15.954,37.673],[5.5,40.5]],"offset":[0.3,-0.3]},{"kind":5,"width":82,"height":85,"points":[[-3,40.5],[-24.9,34.5],[-38,17.5],[-41,6.5],[-41,-9.5],[-36.77,-19.37],[-32.56,-25.99],[-25.31,-33.14],[-18.5,-36.5],[-6,-40.5],[2.82,-42.52],[11.9,-41.3],[21.26,-37.58],[29.09,-31.18],[36.3,-22.35],[39.79,-13.47],[41.29,-3.97],[40.02,9.3],[37.12,19.4],[31.73,27.53],[27.07,32.53],[18.83,37.49],[11.06,39.44],[2,40.5]],"offset":[0,0]},{"kind":6,"width":89,"height":85,"points":[[-4.5,37.5],[-14.42,37.35],[-28.92,32.76],[-35.84,26.68],[-41.78,16.75],[-43.53,10.09],[-43.6,-6.57],[-41.48,-14.75],[-36.28,-24],[-32.39,-28.47],[-26.75,-33.96],[-16.37,-39.21],[-8.44,-41.52],[4.51,-42.42],[13.94,-40.31],[21.5,-37.5],[30.5,-31.5],[36.1,-24.95],[43.17,-9.36],[44.72,1.37],[43.19,11.1],[37.61,24.82],[30,32.05],[23.8,35.25],[14.5,36.96],[5.5,37.5]],"offset":[0,0]},{"kind":7,"width":86,"height":93,"points":[[-16.59,35.35],[-23,29.5],[-30,21.5],[-34,21.5],[-36.67,16.87],[-42,1.5],[-41.898,-16.466],[-37.39,-25.08],[-31,-30.5],[-31.73,-33.32],[-17.07,-43.52],[-10,-44.5],[-7.692,-45.491],[0.49,-46.48],[12.19,-44.23],[19.4,-41.35],[20,-40.5],[28.44,-35.04],[31.77,-31.43],[34,-24.5],[38,-16.5],[41.7,-10.4],[42.12,6.35],[37.45,11.35],[36,12.5],[28,18.5],[19,26.5],[14.64,31.96],[11.99,35.38],[9,35.9],[-0.68,37.44],[-4.7,37.4]],"offset":[0,0]},{"kind":8,"width":82,"height":85,"points":[[-8,42.5],[-10,38.5],[-15,37.5],[-26.25,29.42],[-32.51,23.46],[-37.89,12.96],[-40.084,6.212],[-39.85,-10.55],[-36.75,-20.08],[-33.19,-26.03],[-24.45,-34.65],[-8.76,-41.861],[9.95,-41.53],[16.79,-39.06],[26.21,-33.85],[34.74,-23.87],[39.87,-12.49],[40.44,9.44],[35.26,18.61],[31.02,25.61],[23.02,32.37],[15,36.5],[11,42.5],[4,41.5],[3,39.5],[-3,42.5]],"offset":[0,0]},{"kind":9,"width":71,"height":91,"points":[[-3.72,44.41],[-11.95,40.8],[-17.7,33.85],[-23.5,12.5],[-31.8,-5.2],[-34.515,-13.886],[-34.748,-23.329],[-31.5,-29.91],[-23.38,-38.49],[-18.97,-41.38],[-12.69,-43.4],[-6.5,-42.5],[-1.5,-45.5],[8.508,-44.995],[12.5,-42.5],[19.56,-40.69],[25.91,-37.48],[30.15,-32.54],[34.873,-22.425],[34.47,-11.47],[26.5,6.5],[21.44,23.1],[16.7,36.05],[11.85,40.9],[3.354,44.578]],"offset":[0,0]},{"kind":10,"width":85,"height":87,"points":[[-0.5,43.5],[-0.5,35.5],[-5.5,39.5],[-8.5,39.5],[-13.5,39.5],[-25.69,33.65],[-30.91,29.16],[-35.5,22.5],[-37.59,19.68],[-41.5,7.5],[-41.26,0],[-40.5,-9.5],[-35.3,-22.2],[-30.1,-30.2],[-26.35,-33.6],[-21.82,-37.28],[-15.8,-40.15],[-10,-42.15],[11.44,-42.1],[18.92,-39.75],[28.5,-34.5],[32.5,-29.5],[36.2,-19.91],[41.5,-12.5],[42.5,-2.5],[42.5,0.5],[41.856,8.446],[41.39,10.43],[37.75,17.92],[34.23,25.23],[31.5,26.5],[28.5,32.5],[22.5,36.5],[20.5,36.5],[17.5,36.5],[15.5,36.5],[11.5,38.5],[8.5,37.5],[8.5,43.5]],"offset":[0,0]},{"kind":11,"width":83,"height":85,"points":[[-1.5,38.5],[-9.63,37.75],[-22.5,32.5],[-31.96,24.44],[-36.59,17.24],[-40.144,6.149],[-40.191,-10.476],[-38.187,-18.106],[-33.41,-26.62],[-25.62,-34.44],[-17.11,-38.99],[-10.206,-41.627],[9.523,-41.803],[20.5,-37.5],[25.5,-34.5],[35.5,-26.5],[41.5,-13.5],[41.5,9.5],[33.8,23.59],[25.43,32.01],[6.5,38.5]],"offset":[0,0]},{"kind":12,"width":69,"height":85,"points":[[-5.941,41.098],[-12.55,39.19],[-20.5,34.5],[-22.5,32.5],[-27.7,26.7],[-32.5,15.75],[-33.97,1.57],[-31.92,-10.36],[-22.27,-27.5],[-11.11,-37.2],[-1.7,-41.4],[8.97,-41.45],[18.4,-40.35],[24.2,-36.2],[27,-30.9],[28.9,-14.5],[33.337,-0.521],[34.5,18.5],[27.96,29.26],[21.87,36.99],[12.04,41.49]],"offset":[0,0]},{"kind":13,"width":82,"height":91,"points":[[-0.5,43.5],[-13.5,41.8],[-26.5,34.5],[-32.5,29.5],[-37.49,19.42],[-39.92,2.02],[-40.5,-9.5],[-40.5,-13.5],[-36.5,-22.5],[-31.5,-30.5],[-27.5,-34.5],[-22.5,-38.5],[-16.5,-41.5],[-10.5,-43.5],[11.7,-44.9],[20,-42.5],[28.5,-34.5],[33.47,-31.25],[37.5,-20.5],[39.93,-15.22],[40.49,1.46],[39.9,10.38],[39.5,18.5],[35.5,26.5],[29.5,35.5],[8.5,43.5]],"offset":[0,0]},{"kind":14,"width":84,"height":90,"points":[[-6.121,43.405],[-13.37,40.06],[-33.2,18.9],[-39.15,7.9],[-40.86,-0.37],[-40.86,-15.97],[-37.58,-25],[-33,-32],[-30,-35],[-25.9,-38.36],[-10.85,-44],[12.81,-43.81],[19.16,-41.39],[29,-36],[34.31,-29.32],[39.87,-18.56],[41.22,-1.47],[39.45,3.41],[35.38,15.23],[26.28,26.42],[21,32],[10.98,41.86],[6.3,43.25]],"offset":[0,0]},{"kind":15,"width":80,"height":90,"points":[[-8.03,43.64],[-13.76,41.7],[-20,34],[-22,30],[-28,21],[-35.58,7.29],[-37.93,-2.67],[-38.8,-15],[-33.35,-27.24],[-26.1,-35.8],[-15.1,-41.55],[-8.82,-43.46],[11.93,-43.54],[20.86,-39.9],[27,-36],[33.6,-28.1],[39.07,-18.43],[39.17,-3.58],[37,6.95],[30.81,18.39],[27,24],[23,30],[17.74,37.88],[13.98,42.07],[8.19,43.75]],"offset":[0,0]},{"kind":16,"width":88,"height":90,"points":[[-13.9,42.8],[-19,40.4],[-28.6,35.1],[-39.8,22.1],[-42.97,14.69],[-42.994,-2.924],[-42,-6],[-39.84,-12.92],[-32.24,-26.49],[-20.47,-37.17],[-4.91,-44.24],[14.8,-43.2],[24.6,-38.2],[31.7,-32.7],[35,-28.9],[38.9,-24],[42.31,-13.86],[42.41,0.05],[40.35,8.49],[39,14],[37,18],[32.35,23.89],[25.29,31.84],[17,38],[11.22,40.83],[1.3,43.73]],"offset":[0,0]},{"kind":17,"width":90,"height":90,"points":[[-3,42.7],[-7.9,42.1],[-14.03,40.26],[-21.87,36.58],[-28.3,31.7],[-34.6,24.1],[-38.8,16.9],[-41.1,9.5],[-42.3,-0.8],[-40.8,-11.2],[-36.7,-21.4],[-32.3,-27.6],[-26.4,-33.6],[-20.2,-37.5],[-10.41,-41.55],[-3.45,-42.69],[7.1,-42.4],[16.3,-39.6],[24.5,-34.7],[31.94,-28.07],[35.3,-23.8],[40,-14.1],[41.3,-8.3],[42,-1.9],[41.25,9.96],[38.24,17.64],[34.87,24.17],[29.1,31.1],[23.9,35.4],[15.6,40.1],[7.1,42.2]],"offset":[0,0]},{"kind":18,"width":81,"height":90,"points":[[-26.5,28],[-33.5,19],[-37.68,11.75],[-38.5,4],[-39.7,-6.1],[-39.65,-11.88],[-37.65,-15.58],[-31.22,-19.81],[-15.35,-30.55],[5.8,-39],[21.7,-42.2],[28,-41.1],[35.7,-35.5],[40.5,-24],[39.14,-13.41],[35.5,2],[29.16,20.78],[25.5,27],[16.5,29],[8.29,36.15],[7.06,36.88],[-1.5,38],[-13.17,33.18],[-19.2,31.6]],"offset":[0,0]},{"kind":19,"width":87,"height":84,"points":[[-9.5,40.68],[-16.42,38.76],[-26.76,33.01],[-34.76,24.6],[-41.35,12.26],[-43.04,-1.72],[-40.96,-13.77],[-36.96,-22.42],[-28.1,-32.05],[-18.41,-38.51],[-11.47,-40.78],[0.95,-41.69],[11.2,-40.45],[26.66,-33.53],[36.32,-23.82],[42.18,-10.16],[42.49,8.07],[39.7,15.6],[35.91,23.4],[26.91,32.94],[16.2,39.17],[9.26,40.76]],"offset":[0,0]},{"kind":20,"width":85,"height":87,"points":[[-9.82,42.73],[-16.89,40.87],[-26.52,35.36],[-32.54,30.07],[-37.68,24.01],[-41.58,11.24],[-40.68,-4.37],[-36,-17.05],[-27.5,-28.5],[-18.23,-34.45],[-5.82,-40.84],[9.7,-40.9],[15.94,-39.15],[25.6,-35.4],[29.8,-31.9],[34.05,-27.65],[36.8,-23.2],[41.1,-14.08],[41.74,-1.03],[40.02,8.26],[30.38,25.8],[17.15,36.79],[8.79,41.73]],"offset":[0,0]},{"kind":21,"width":85,"height":83,"points":[[-12.85,39.2],[-25.9,35.6],[-35.14,25.44],[-40.79,13.67],[-40.23,-11.99],[-30,-29.3],[-22.03,-35.38],[-9.5,-40.32],[7.88,-40.5],[12,-39.5],[24.6,-33.3],[31.5,-27.5],[36.1,-21.7],[40.9,-6.79],[40.62,10.23],[39.06,17.52],[34.19,26.74],[24.82,35.03],[7.4,40.24]],"offset":[0,0]},{"kind":22,"width":85,"height":83,"points":[[-3.76,38.26],[-16.04,36.21],[-22.5,34.5],[-37.72,19.53],[-41.72,8.01],[-41.02,-9.15],[-35.7,-24.5],[-26.9,-33.7],[-14.2,-39.5],[3.4,-40.8],[16.4,-39.6],[28.6,-31.8],[33.5,-26.5],[37,-20],[42.5,-9.5],[41.46,10.64],[34.82,24.23],[25.5,33.23],[16.52,37.27]],"offset":[0,0]},{"kind":23,"width":84,"height":91,"points":[[-8.8,44.6],[-13.21,41.21],[-14,34.5],[-27.51,33.73],[-34.4,27.05],[-37.4,20.6],[-36.89,15.15],[-36.4,11.6],[-37.8,6.9],[-39.71,3.03],[-40.78,-2.25],[-41.52,-8.32],[-40.97,-15.5],[-39.58,-21.32],[-36.1,-26.8],[-25.9,-37.1],[-16.79,-42.19],[-9.986,-44.609],[-0.45,-45.16],[8.85,-44.45],[20.05,-40.5],[27,-36.5],[34.83,-28.92],[38.52,-21.96],[41.17,-14],[41.69,-3.36],[40.78,2.35],[37.28,12.44],[34,16.5],[35.21,25.93],[32.18,30.57],[29.37,33.95],[24.45,36.89],[16.66,37.59],[6.49,35.59],[0,45.5]],"offset":[0,0]},{"kind":24,"width":91,"height":91,"points":[[-4.6,41.5],[-14.5,36.5],[-20.5,34.5],[-27.91,30.77],[-36.5,21.3],[-41.568,8.114],[-42.4,-2.5],[-41.31,-11.43],[-38.7,-19.8],[-34.5,-26.5],[-29.3,-32.2],[-24.98,-35.53],[-13.8,-40.7],[-2.71,-42.23],[7.5,-42],[15.1,-40.05],[20.9,-38],[27.43,-33.73],[34.5,-26.5],[38.5,-20.23],[41.43,-11.56],[42.5,-2.4],[41.8,6.5],[40.6,11.41],[38,17.9],[34.33,23.75],[29.6,29.3],[23.01,33.38],[14.5,36.5],[9.14,40.01]],"offset":[0,0]},{"kind":25,"width":85,"height":91,"points":[[-3.09,43.11],[-5.5,36.5],[-20.26,33.34],[-24.5,32.5],[-30.74,29.31],[-36.5,21.5],[-41.53,11.07],[-41.52,-8],[-37.5,-16.5],[-34.01,-26.2],[-27.5,-32.5],[-24.5,-35.5],[-22.5,-37.5],[-18.6,-40.35],[-10.5,-42.5],[-6.8,-44.22],[0.21,-45.31],[5.91,-44.23],[10.5,-42.5],[17.84,-40.67],[22.5,-36.5],[27.84,-32.38],[31.5,-26.5],[34.6,-22.4],[36.84,-17.56],[37.95,-9.62],[41.59,-3.49],[40.86,12.34],[37.5,22.5],[33.5,26.5],[29.5,31.5],[25.35,33.05],[16.5,35.5],[3.5,35.5]],"offset":[0,0]},{"kind":26,"width":85,"height":83,"points":[[-3.5,41.5],[-7.5,38.5],[-15.19,39.78],[-23.5,36.5],[-30.31,35.39],[-35.08,30.21],[-40.73,15.8],[-41.53,7.12],[-37.35,-13.75],[-27.78,-29.4],[-20.5,-36.5],[-15.7,-39.6],[-0.03,-41.61],[14.02,-40.38],[21.5,-34.5],[28.54,-28.53],[37.5,-14.5],[42.5,2.5],[42.5,15.5],[38.5,19.5],[38.5,27.5],[34.5,31.5],[24.5,37.5],[20.05,39],[13.42,39.27],[4.5,41.5]],"offset":[0,0]},{"kind":27,"width":87,"height":85,"points":[[-14.47,41.04],[-27.16,35.12],[-35.5,27.5],[-39.18,20.59],[-41.97,10.12],[-42.13,-6.54],[-38.94,-17.01],[-34.45,-25.77],[-24.8,-35.5],[-12.5,-41.3],[11.8,-40.31],[27.36,-32.42],[34.5,-25.5],[41.74,-8.68],[43.13,0.75],[41.39,13.25],[36.48,24.69],[29.01,33.62],[11.8,40.59]],"offset":[0,0]},{"kind":28,"width":82,"height":85,"points":[[-8.76,41.49],[-24,34.5],[-30.9,27.6],[-35.85,19.15],[-39.98,9.22],[-39.85,-9.36],[-38.17,-16.15],[-32.93,-24.99],[-24,-34.5],[-8.65,-41.5],[9.16,-41.18],[19.15,-37.51],[26,-32.5],[29,-29.5],[35.2,-21.2],[39.45,-7.65],[39.11,11.15],[34.94,20.6],[30,28.5],[26,32.5],[8.89,40.88]],"offset":[0,0]},{"kind":29,"width":85,"height":87,"points":[[-18.5,43.5],[-25.5,42.5],[-25.5,31.5],[-27.5,27.5],[-30.5,24.5],[-37.57,17.03],[-41.35,6.51],[-41.439,-8.489],[-39.96,-15.15],[-30.91,-30.84],[-24.7,-37.86],[-14.5,-42.2],[-1,-42.2],[3.62,-39.72],[6.08,-33.52],[18.15,-34.1],[24.5,-33.5],[30.5,-26.5],[28.95,-19.9],[36.1,-18.6],[42.5,-13.5],[41.36,-5.89],[36.7,-0.4],[18.5,8.5],[4.5,21.5],[-2.5,27.5],[-0.5,39.5],[-4.5,43.5]],"offset":[0,0]},{"kind":30,"width":85,"height":85,"points":[[-9.35,41.25],[-17.5,38.6],[-26.03,33.2],[-34.8,24.9],[-39.74,14.65],[-41.53,7.92],[-42.5,-8.5],[-37.67,-20.09],[-33.97,-26.32],[-24.6,-35.05],[-16.17,-39.18],[-8.85,-41.78],[10.2,-41.4],[19.8,-37.7],[26.36,-33.83],[37.12,-22.29],[41.22,-11.59],[42.2,0],[41.82,9.82],[38.15,18.46],[34.75,24.75],[29.15,30.74],[24.5,34.5],[17.72,38.62],[9.25,40.97],[1.7,41.8]],"offset":[0,0]}],"floor":{"position":[0,-363.538],"size":[750,740],"offset":[0,0.9],"points":[[-46,-150],[51,-148],[48.5,100],[56,195],[375,370],[376.1,-371.9],[-378,-382],[-376,-235],[-576,477],[-53,197],[-44.1,95.6]]},"lock":{"position":[0,-466.325],"size":[163,95],"colliderSize":[80,90]}};
const base = 'db://assets/app-bundle/app-view/';

/** 加载仅编辑器使用的制作工具。 */

/** 卸载制作工具。 */


/** 创建编辑器节点；此文件不进入游戏构建。 */
function node(name, parent, width = 750, height = 1334, x = 0, y = 0) {
    const result = new cc.Node(name);
    result.layer = cc.Layers.Enum.UI_2D;
    result.addComponent(cc.UITransform).setContentSize(width, height);
    if (parent) result.parent = parent;
    result.setPosition(x, y);
    return result;
}

/** 通过资产数据库查询实际 UUID，加载已导入的资源。 */
async function asset(url, spriteFrame = false) {
    const info = await Editor.Message.request('asset-db', 'query-asset-info', url);
    if (!info) throw new Error('资源不存在：' + url);
    let uuid = info.uuid;
    if (spriteFrame) {
        const meta = await Editor.Message.request('asset-db', 'query-asset-meta', url);
        const sub = Object.values(meta.subMetas).find(value => value.importer === 'sprite-frame');
        if (!sub) throw new Error('图片尚无 SpriteFrame：' + url);
        uuid = sub.uuid;
    }
    return new Promise((resolve, reject) => cc.assetManager.loadAny(uuid, (error, value) => error ? reject(error) : resolve(value)));
}

/** 在预制体内放置原项目图片。 */
async function sprite(name, parent, url, width, height, x = 0, y = 0) {
    const result = node(name, parent, width, height, x, y);
    const component = result.addComponent(cc.Sprite);
    component.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    component.spriteFrame = await asset(url, true);
    result.getComponent(cc.UITransform).setContentSize(width, height);
    return result;
}

/** 在编辑器中制作标签并返回组件供业务脚本绑定。 */
function label(name, parent, text, size, y, width = 650) {
    const result = node(name, parent, width, size * 2, 0, y);
    const component = result.addComponent(cc.Label);
    component.string = text;
    component.fontSize = size;
    component.lineHeight = size + 8;
    component.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    component.verticalAlign = cc.Label.VerticalAlign.CENTER;
    component.color = new cc.Color(37, 61, 85, 255);
    return component;
}

/** 把按钮事件序列化到预制体，运行时不搜索节点。 */
async function button(name, parent, frame, text, y, target, componentName, handler) {
    const result = await sprite(name, parent, frame, 320, 104, 0, y);
    // 原按钮图片已含文字，不再叠加标签。
    const component = result.addComponent(cc.Button);
    component.transition = cc.Button.Transition.SCALE;
    component.zoomScale = 0.94;
    const event = new cc.EventHandler();
    event.target = target;
    event.component = componentName;
    event.handler = handler;
    component.clickEvents = [event];
    return result;
}

/** 使用 Creator 自带序列化器保存预制体，不手写资产结构。 */
async function save(root, url) {
    const serialized = cce.Prefab.generatePrefabDataFromNode(root);
    const content = serialized.prefabData || serialized;
    const existing = await Editor.Message.request('asset-db', 'query-asset-info', url);
    const result = await Editor.Message.request('asset-db', existing ? 'save-asset' : 'create-asset', url, content);
    root.destroy();
    return result;
}

/** 制作与地形美术对应的静态矩形碰撞体。 */
function wall(name, parent, x, y, width, height, angle = 0) {
    const result = node(name, parent, width, height, x, y);
    result.angle = angle;
    const body = result.addComponent(cc.RigidBody2D);
    body.type = cc.ERigidBody2DType.Static;
    const collider = result.addComponent(cc.BoxCollider2D);
    collider.size = new cc.Size(width, height);
    collider.friction = 0.12;
    collider.restitution = 0;
}

const methods = {
    /** 制作独立道具栏，复制原版按钮图片，不在运行时创建节点。 */
    async createPropToolbar() {
        const root=node('PropToolbar');
        const component=root.addComponent('PropToolbar');
        for (const [kind,x] of [['shuffle',-245],['eliminate',245]]) {
            const item=await sprite(kind==='shuffle'?'ShuffleButton':'EliminateButton',root,base+'page/game/resources/textures/prop-'+kind+'.png',120,120,x,-655);
            const event=new cc.EventHandler();event.target=root;event.component='PropToolbar';event.handler=kind;
            item.addComponent(cc.Button).clickEvents=[event];
            const count=label(kind+'Count',root,kind==='shuffle'?'刷新 ×2':'消除 ×2',24,-740,210);
            count.node.setPosition(x,-740,0);
            component[kind+'Count']=count;
        }
        return save(root,base+'page/game/resources/prefabs/PropToolbar.prefab');
    },
    /** 通过 Creator 官方消息重新编译预览引擎，不修改引擎源码。 */
    async rebuildEngine() {
        return Editor.Message.request('engine', 'rebuild');
    },
    /** 使用框架模板设置内置逻辑包，保持与 XForge 创建器一致。 */
    async configureBuiltin() {
        const results = [];
        for (const name of ['app-model', 'app-controller']) {
            const url = 'db://assets/app-builtin/' + name;
            const meta = await Editor.Message.request('asset-db', 'query-asset-meta', url);
            meta.userData = { isBundle: true, bundleConfigID: 'auto_398Ij6Mc1B2Y7sW3e6BgFC', priority: 1 };
            await Editor.Message.request('asset-db', 'save-asset-meta', url, JSON.stringify(meta));
            results.push(url);
        }
        return results;
    },
    /** 验证编辑器能访问本工具和所有业务组件。 */
    inspect() {
        return ['FruitItem', 'FruitVisual', 'FruitSpawner', 'GameBoard', 'GameHud', 'PageGame', 'PageHome', 'PopResult']
            .map(name => ({ name, found: !!cc.js.getClassByName(name) }));
    },

    /** 按 XForge 自带模板设置页面原生包和资源包。 */
    async configureBundles() {

        const results = [];
        for (const [folder, bundle] of [['page/editor', 'page-editor'], ['page/game', 'page-game'], ['page/home', 'page-home'], ['pop/result', 'pop-result']]) {
            for (const kind of ['native', 'resources']) {
                const url = base + folder + '/' + kind;
                const meta = await Editor.Message.request('asset-db', 'query-asset-meta', url);
                const template = kind === 'native'
                    ? {
    "isBundle": true,
    "bundleConfigID": "auto_f7NI9WxFVIO6e8LbJGF72k",
    "priority": 1
}
                    : {
    "isBundle": true,
    "bundleConfigID": "auto_11aBEBWDxI/6ryvKvFthEo",
    "priority": 4
};
                meta.userData = { ...template, bundleName: bundle + (kind === 'resources' ? '-res' : '') };
                await Editor.Message.request('asset-db', 'save-asset-meta', url, JSON.stringify(meta));
                results.push({url,bundle:meta.userData.bundleName});
            }
        }
        return results;
    },

    /** 原 flower 预制体为 117×117，GameSc 使用 0.9 倍缩放；不添加碰撞体。 */
    async createIceFruit() {
        const root = node('IceFruitView', null, 235.59, 297.28);
        root.setScale(0.45, 0.45, 1);
        const view = root.addComponent('IceFruitView');
        view.skeleton = root.addComponent(cc.sp.Skeleton);
        view.skeleton.skeletonData = await asset(base + 'page/game/resources/spine/ice/bingzha.json');
        view.skeleton.premultipliedAlpha = false;
        view.skeleton.setAnimation(0, '1', false);
        view.countLabel = label('CountLabel', root, '1', 80, -7.858, 180);
        view.audio = root.addComponent(cc.AudioSource);
        view.audio.playOnAwake = false;
        view.breakClip = await asset(base + 'page/game/resources/audio/ice.mp3');
        return save(root, base + 'page/game/resources/prefabs/IceFruitView.prefab');
    },

    /** 原 flower 预制体及其原版缩放。 */
    async createHiddenFruit() {
        const root = await sprite('HiddenFruitView', null, base + 'page/game/resources/textures/hidden-flower.png', 117, 117);
        root.setScale(0.9, 0.9, 1);
        root.addComponent('HiddenFruitView');
        return save(root, base + 'page/game/resources/prefabs/HiddenFruitView.prefab');
    },

    /** 为前四关每种水果制作独立预制体，复制原版图片尺寸和碰撞轮廓。 */
    async createFruit() {
        const results = [];
        for (const definition of sourceGeometry.fruits) {
            const name = definition.kind === 21 ? 'FruitItem' : 'Fruit' + String(definition.kind).padStart(2, '0');
            const root = node(name, null, definition.width, definition.height);
            const body = root.addComponent(cc.RigidBody2D);
            body.type = cc.ERigidBody2DType.Static;
            body.enabledContactListener = true;
            const collider = root.addComponent(cc.PolygonCollider2D);
            collider.points = definition.points.map(point => new cc.Vec2(...point));
            collider.offset = new cc.Vec2(...definition.offset);
            collider.restitution = 0;
            const visualNode = await sprite('Visual', root, base + 'page/game/resources/textures/fruit-' + definition.kind + '.png', definition.width, definition.height);
            const visual = visualNode.addComponent('FruitVisual');
            visual.sprite = visualNode.getComponent(cc.Sprite);
            const item = root.addComponent('FruitItem');
            item.kind = definition.kind;
            item.body = body;
            item.collider = collider;
            item.visual = visual;
            results.push(await save(root, base + 'page/game/resources/prefabs/' + name + '.prefab'));
        }
        return results;
    },

    /** 按原 Blackhole 预制体的图片尺寸、数量位置与缩放制作独立表现。 */
    async createBlackHole() {
        const root = node('BlackHoleView', null, 70, 70);
        const view = root.addComponent('BlackHoleView');
        const ring = await sprite('Ring', root, base + 'page/game/resources/textures/black-hole.png',70,70);
        view.ring = ring.getComponent(cc.Sprite);
        const badge = await sprite('CountBadge', root, base + 'page/game/resources/textures/black-hole-badge.png',37,37,24.534,-20.877);
        badge.setScale(0.8,0.8,1);
        view.badge = badge;
        view.countLabel = label('Count',badge,'3',30,0.793,70);
        view.countLabel.node.setPosition(-0.359,0.793,0);
        view.countLabel.color = cc.Color.BLACK;
        return save(root,base + 'page/game/resources/prefabs/BlackHoleView.prefab');
    },

    /** 按原 Hint 预制体尺寸与文字位置制作机制提示。 */
    async createLevelHint() {
        const root = node('LevelHintView', null, 492, 223, 0, 200);
        const view = root.addComponent('LevelHintView');
        view.picture = root.addComponent(cc.Sprite);
        view.picture.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        view.frames = [];
        for (const name of ['vertical', 'horizontal', 'hidden', 'ice', 'black-hole']) {
            view.frames.push(await asset(base + 'page/game/resources/textures/hints/' + name + '.png', true));
        }
        view.picture.spriteFrame = view.frames[0];
        view.hiddenText = await sprite('HiddenText', root, base + 'page/game/resources/textures/hints/hidden-fruit-text.png', 347, 45, 0, -45.175);
        view.hiddenText.active = false;
        return save(root, base + 'page/game/resources/prefabs/LevelHintView.prefab');
    },

    /** 使用原场景地形多边形和锁墙，取代验证版简化墙体。 */
    async createReward() {
        const root=node('LockWallView',null,163,95);
        const view=root.addComponent('LockWallView');
        view.visual=await sprite('Visual',root,base+'page/game/resources/textures/lock-wall.png',163,95);
        view.body=root.addComponent(cc.RigidBody2D);view.body.type=cc.ERigidBody2DType.Static;
        root.addComponent(cc.BoxCollider2D).size=new cc.Size(80,90);
        view.button=root.addComponent(cc.Button);
        const event=new cc.EventHandler();event.target=root;event.component='LockWallView';event.handler='requestUnlock';view.button.clickEvents=[event];
        await save(root,base+'page/game/resources/prefabs/LockWallView.prefab');
        const panelRoot=node('DevelopmentRewardPanel');
        const panel=panelRoot.addComponent('DevelopmentRewardPanel');
        const mask=await sprite('Mask',panelRoot,base+'page/game/resources/textures/settings/mask.png',750,2000);
        mask.getComponent(cc.Sprite).color=new cc.Color(0,0,0,180);mask.addComponent(cc.BlockInputEvents);
        await sprite('Background',panelRoot,base+'page/game/resources/textures/settings/panel.png',627,621);
        panel.description=label('Description',panelRoot,'广告开发模拟',30,190,550);
        panel.description.node.getComponent(cc.UITransform).setContentSize(550,160);
        for(const [name,text,y,handler] of [['Complete','模拟完整观看',30,'complete'],['Cancel','模拟提前退出',-85,'cancel'],['Fail','模拟播放失败',-200,'fail']]){
            const target=label(name,panelRoot,text,36,y,500).node;
            const event=new cc.EventHandler();event.target=panelRoot;event.component='DevelopmentRewardPanel';event.handler=handler;
            const button=target.addComponent(cc.Button);button.transition=cc.Button.Transition.SCALE;button.zoomScale=0.94;button.clickEvents=[event];
        }
        return save(panelRoot,base+'page/game/resources/prefabs/DevelopmentRewardPanel.prefab');
    },

    /** 使用原场景地形和独立锁墙预制体。 */
    async createBoard() {
        const root = node('GameBoard');
        // ??????????????????????
        (await sprite('Background', root, base + 'page/game/resources/textures/background.png', 750, 1667)).active = false;
        const definition = sourceGeometry.floor;
        const floor = await sprite('Floor', root, base + 'page/game/resources/textures/terrain.png', ...definition.size, ...definition.position);
        floor.addComponent(cc.RigidBody2D).type = cc.ERigidBody2DType.Static;
        const polygon = floor.addComponent(cc.PolygonCollider2D);
        polygon.points = definition.points.map(point => new cc.Vec2(...point));
        polygon.offset = new cc.Vec2(...definition.offset);
        polygon.restitution = 0;
        const lock = sourceGeometry.lock;
        const lockLayout=node('LockWallLayout',root,...lock.size,...lock.position);
        const lockNode=cc.instantiate(await asset(base+'page/game/resources/prefabs/LockWallView.prefab'));
        lockNode.parent=lockLayout;
        wall('LeftEdge', root, -380.287, 0, 10, 1280);
        wall('RightEdge', root, 379.916, 0, 10, 1280);
        const spawner = root.addComponent('FruitSpawner');
        // 迁移适配：顶部裁剪线 y=500，避免场外水果遮住 HUD；水果坐标不变。
        const viewport = node('FruitViewport', root, 750, 1334);
        viewport.getComponent(cc.UITransform).setAnchorPoint(0.5, 0.5);
        viewport.addComponent(cc.Mask).type = cc.Mask.Type.GRAPHICS_RECT;
        spawner.fruitRoot = node('Fruits', viewport);
        spawner.iceFruitPrefab = await asset(base + 'page/game/resources/prefabs/IceFruitView.prefab');
        spawner.blackHolePrefab = await asset(base + 'page/game/resources/prefabs/BlackHoleView.prefab');
        spawner.hiddenFruitPrefab = await asset(base + 'page/game/resources/prefabs/HiddenFruitView.prefab');
        spawner.fruitPrefabs = [];
        for (const definition of sourceGeometry.fruits) {
            const name = definition.kind === 21 ? 'FruitItem' : 'Fruit' + String(definition.kind).padStart(2, '0');
            spawner.fruitPrefabs.push(await asset(base + 'page/game/resources/prefabs/' + name + '.prefab'));
        }
        const board = root.addComponent('GameBoard');
        board.spawner = spawner;
        const effects=cc.instantiate(await asset(base+'page/game/resources/prefabs/RemovalEffects.prefab'));
        effects.parent=root;
        board.removalEffectsRoot=effects;
        board.lockWallRoot = lockNode;
        board.leftBoundary = root.getChildByName('LeftEdge');
        board.rightLine = await sprite('RightLine',root,base + 'page/game/resources/textures/right-line.png',4,1023,313.357,179.307);
        board.rightLine.active = false;
        const hint = cc.instantiate(await asset(base + 'page/game/resources/prefabs/LevelHintView.prefab'));
        hint.parent = root;
        board.levelHintRoot = hint;
        hint.active = false;
        return save(root, base + 'page/game/resources/prefabs/GameBoard.prefab');
    },

    /** 按原 baozha 预制体制作爆炸与独立特效层，所有节点和音源仅在编辑器创建。 */
    async createRemovalEffects() {
        const bag=node('FruitBagView');
        const bagView=bag.addComponent('FruitBagView');
        bagView.body=node('BagBody',bag,167,182);
        await sprite('BagTop',bagView.body,base+'page/game/resources/textures/bag-top.png',156,46,0,82.598);
        bagView.target=node('CollectionPoint',bagView.body);
        await sprite('BagBottom',bagView.body,base+'page/game/resources/textures/bag-bottom.png',167,152);
        bagView.audio=bag.addComponent(cc.AudioSource);
        bagView.audio.playOnAwake=false;
        bagView.audio.clip=await asset(base+'page/game/resources/audio/drop.mp3');
        await save(bag,base+'page/game/resources/prefabs/FruitBagView.prefab');
        const root=node('ExplosionView',null,945.82,2328.04);
        const view=root.addComponent('ExplosionView');
        view.skeleton=root.addComponent(cc.sp.Skeleton);
        view.skeleton.skeletonData=await asset(base+'page/game/resources/spine/explosion/baozha.json');
        view.skeleton.premultipliedAlpha=false;
        view.skeleton.timeScale=1.2;
        view.skeleton.setAnimation(0,'1',false);
        await save(root,base+'page/game/resources/prefabs/ExplosionView.prefab');
    },

    /** 等待袋子与爆炸资产完成导入后，单独制作组合特效层，避免同次保存后立即读取旧缓存。 */
    async createRemovalEffectsLayer() {
        const layer=node('RemovalEffects');
        const effects=layer.addComponent('RemovalEffects');
        effects.explosionPrefab=await asset(base+'page/game/resources/prefabs/ExplosionView.prefab');
        effects.audio=layer.addComponent(cc.AudioSource);
        effects.audio.playOnAwake=false;
        effects.audio.clip=await asset(base+'page/game/resources/audio/bomb.mp3');
        effects.audio.loop=false;
        const mergeAudio=node('MergeAudio',layer).addComponent(cc.AudioSource);
        mergeAudio.playOnAwake=false;
        mergeAudio.clip=await asset(base+'page/game/resources/audio/merge.mp3');
        effects.mergeAudio=mergeAudio;
        const bagInstance=cc.instantiate(await asset(base+'page/game/resources/prefabs/FruitBagView.prefab'));
        bagInstance.parent=node('BagLayout',layer,167,182,0,-641.082);
        effects.bagRoot=bagInstance;
        return save(layer,base+'page/game/resources/prefabs/RemovalEffects.prefab');
    },

    /** 制作独立 HUD；错误说明与导航按钮始终由预制体提供。 */
    async createSettings() {
        const textures = base + 'page/game/resources/textures/settings/';
        const prefabs = base + 'page/game/resources/prefabs/';
        for (const [kind, width, height, iconX, textX, textY, switchX, switchY] of [
            ['Music',79,87,-168.103,-5.526,0,190.631,-5],
            ['Sound',84,72,-165.202,-5.526,0,190.631,-5],
            ['Vibrate',84,84,-161.063,0,-2.699,192.363,-7.699]
        ]) {
            const root = node('Settings' + kind + 'Row',null,580,100);
            const row = root.addComponent('SettingsToggleView');
            await sprite('Icon',root,textures+kind.toLowerCase()+'-icon.png',width,height,iconX,0);
            await sprite('Text',root,textures+kind.toLowerCase()+'-text.png',kind==='Sound'?87:86,kind==='Vibrate'?44:45,textX,textY);
            const toggle = await sprite('Switch',root,textures+'switch-on.png',201,75,switchX,switchY);
            row.switchPicture = toggle.getComponent(cc.Sprite);
            row.onFrame = await asset(textures+'switch-on.png',true);
            row.offFrame = await asset(textures+'switch-off.png',true);
            const event = new cc.EventHandler();
            event.target=root;event.component='SettingsToggleView';event.handler='requestToggle';
            toggle.addComponent(cc.Button).clickEvents=[event];
            await save(root,prefabs+'Settings'+kind+'Row.prefab');
        }
        const root = node('SettingsPanel');
        const panel = root.addComponent('SettingsPanel');
        panel.opacity = root.addComponent(cc.UIOpacity);
        const mask = await sprite('Mask',root,textures+'mask.png',750,2000);
        mask.getComponent(cc.Sprite).color = new cc.Color(0,0,0,120);
        mask.addComponent(cc.BlockInputEvents);
        panel.content = node('Content',root,750,1334,0,150);
        await sprite('Background',panel.content,textures+'panel.png',627,621);
        await sprite('Title',panel.content,textures+'title.png',122,64,0,258.778);
        for (const [kind,y,field] of [['Music',119.913,'musicRow'],['Sound',-22.3,'soundRow'],['Vibrate',-156.274,'vibrateRow']]) {
            const row=cc.instantiate(await asset(prefabs+'Settings'+kind+'Row.prefab'));
            // 布局由普通容器序列化，避免嵌套预制体实例的位置覆盖在保存时丢失。
            const holder=node(kind+'Layout',panel.content,580,100,-13.807,y);
            row.parent=holder;panel[field]=row;
        }
        for (const [name,file,y,handler] of [['Home','home-button',-393.855,'returnHome'],['Restart','restart-button',-537.855,'restartGame'],['Continue','continue-button',-681.855,'continueGame']]) {
            const target=await sprite(name,panel.content,textures+file+'.png',327,124,0,y);
            const event=new cc.EventHandler();event.target=root;event.component='SettingsPanel';event.handler=handler;
            const control=target.addComponent(cc.Button);control.transition=cc.Button.Transition.SCALE;control.zoomScale=0.94;control.clickEvents=[event];
        }
        panel.warningLabel=label('Warning',panel.content,'',22,-258,560);
        return save(root,prefabs+'SettingsPanel.prefab');
    },

    /** 按原start.prefab制作双星，图片154×149、上下间距50设计像素。 */
    async createStarFlight() {
        const root = node('StarFlightView', null, 117, 117);
        root.addComponent('StarFlightView');
        const texture = base + 'page/game/resources/textures/effects/star.png';
        await sprite('UpperStar', root, texture, 154, 149, 0, 25);
        await sprite('LowerStar', root, texture, 154, 149, 0, -25);
        return save(root, base + 'page/game/resources/prefabs/StarFlightView.prefab');
    },

    /** 制作独立HUD，所有按钮及事件在编辑器绑定。 */
    async createHud() {
        const root = node('GameHud');
        const component = root.addComponent('GameHud');
        component.title = label('LevelTitle', root, '第 1 关', 36, 595);
        component.status = label('Progress', root, '正在加载关卡…', 28, 545);
        component.hint = label('Hint', root, '点击同类水果；整体移动时请稍候', 24, -785);
        component.hint.node.getComponent(cc.UITransform).setContentSize(650,100);
        const home = label('HomeButton', root, '返回首页', 28, -855, 180).node;
        home.setPosition(-200, -855);
        const replay = label('ReplayButton', root, '重玩第 1 关', 28, -855, 230).node;
        replay.setPosition(180, -855);
        for (const [target, handler] of [[home, 'home'], [replay, 'replay']]) {
            const event = new cc.EventHandler();
            event.target = root;
            event.component = 'GameHud';
            event.handler = handler;
            target.addComponent(cc.Button).clickEvents = [event];
        }
        component.replayButton = replay;
        replay.active = false;
        const settings=label('SettingsButton',root,'设置',28,595,100).node;
        settings.setPosition(300,595,0);
        const settingsEvent=new cc.EventHandler();settingsEvent.target=root;settingsEvent.component='GameHud';settingsEvent.handler='settings';
        settings.addComponent(cc.Button).clickEvents=[settingsEvent];
        return save(root, base + 'page/game/resources/prefabs/GameHud.prefab');
    },

    /** 制作页面根预制体，子预制体由 XForge 资源加载器实例化。 */
    async createGamePage() {
        const root = node('PageGame');
        const component = root.addComponent('PageGame');
        if (component.resetInEditor) component.resetInEditor();
        await sprite('Background', root, base + 'page/game/resources/textures/background.png', 750, 1667);
        component.boardRoot = node('BoardRoot', root);
        component.hudRoot = node('HudRoot', root);
        return save(root, base + 'page/game/native/PageGame.prefab');
    },

    /** 制作首页完整节点树，并将开始按钮绑定到页面方法。 */
    async createEditor() {
        const markerRoot = node('EditorFruitMarker', null, 90, 90);
        const marker = markerRoot.addComponent('EditorFruitMarker');
        marker.icon = (await sprite('Icon', markerRoot, base + 'page/editor/resources/textures/fruit-1.png', 70, 70)).getComponent(cc.Sprite);
        marker.badge = label('Badge', markerRoot, '', 17, -48, 160);
        await save(markerRoot, base + 'page/editor/resources/prefabs/EditorFruitMarker.prefab');
        const root = node('PageEditor');
        const view = root.addComponent('PageEditor');
        if (view.resetInEditor) view.resetInEditor();
        await sprite('Background', root, base + 'page/editor/resources/textures/background.png', 750, 1667);
        view.modeLabel = label('Mode', root, '关卡编辑器', 34, 605);
        // 按钮和文本框全部在编辑器内制作，运行时仅绑定业务。
        function textButton(name, text, x, y, handler) {
            const title = label(name, root, text, 26, y, 170);
            title.node.setPosition(x, y);
            const button = title.node.addComponent(cc.Button);
            button.transition = cc.Button.Transition.SCALE;
            button.zoomScale = 0.94;
            const event = new cc.EventHandler();
            event.target = root; event.component = 'PageEditor'; event.handler = handler;
            button.clickEvents = [event];
        }
        for (const [name,text,x,y,handler] of [
            ['Add','添加水果',-260,540,'addFruit'],['Delete','删除',-85,540,'deleteFruit'],
            ['Hidden','隐藏标记',90,540,'toggleHidden'],['Ice','设置冰层',265,540,'setIce'],
            ['Hole','黑洞开关',-260,470,'toggleBlackHole'],['Member','添加成员',-85,470,'addMember'],
            ['ModeButton','切换模式',90,470,'toggleMode'],['Reset','视口归零',265,470,'resetViewport'],
            ['Trial','试玩',280,403,'trial'],
            ['Import','导入',-230,-620,'importJson'],['Export','导出',0,-620,'exportJson'],['Home','返回主页',230,-620,'home']
        ]) textButton(name,text,x,y,handler);
        function editBox(name,x,y,width,height,initial,multiline) {
            const clipRoot = node(name + 'Clip',root,width,height,x,y);
            const inputRoot = node(name,clipRoot,width,height);
            const text = label('Text',inputRoot,initial,24,0,width);
            text.node.getComponent(cc.UITransform).setContentSize(width,height);
            const placeholder = label('Placeholder',inputRoot,'输入内容',24,0,width);
            text.node.getComponent(cc.UITransform).setAnchorPoint(0, 1);
            placeholder.node.getComponent(cc.UITransform).setAnchorPoint(0, 1);
            const input = inputRoot.addComponent(cc.EditBox);
            input.textLabel = text; input.placeholderLabel = placeholder;
            input.inputMode = multiline ? cc.EditBox.InputMode.ANY : cc.EditBox.InputMode.SINGLE_LINE;
            input.maxLength = multiline ? 100000 : 8;
            input.string = initial;
            if (multiline) {
                text.overflow = cc.Label.Overflow.CLAMP;
                text.enableWrapText = true;
                text.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
                text.verticalAlign = cc.Label.VerticalAlign.TOP;
                clipRoot.addComponent(cc.Mask).type = cc.Mask.Type.GRAPHICS_RECT;
            }
            return input;
        }
        label('NumberCaption',root,'编号 / 冰层数：',24,403,500).node.setPosition(-140,403);
        view.numberInput = editBox('NumberInput',120,403,140,50,'1',false);
        const viewport = node('Viewport',root,710,650,0,45);
        viewport.addComponent(cc.Mask).type = cc.Mask.Type.GRAPHICS_RECT;
        view.fruitRoot = node('FruitRoot',viewport,710,650);
        view.statusLabel = label('Status',root,'拖拽移动 · 滚轮浏览 · Delete删除',22,-310,710);
        label('JsonCaption',root,'关卡 JSON（点击下方输入区导入或复制导出）',22,-355,710);
        view.jsonInput = editBox('JsonInput',0,-475,680,180,'',true);
        view.markerPrefab = await asset(base + 'page/editor/resources/prefabs/EditorFruitMarker.prefab');
        view.fruitFrames = [];
        for (let kind=1;kind<=30;kind++) view.fruitFrames.push(await asset(base + 'page/editor/resources/textures/fruit-'+kind+'.png',true));
        return save(root,base+'page/editor/native/PageEditor.prefab');
    },

    /** 制作游戏主页及编辑器入口。 */
    async createHome() {
        const root = node('PageHome');
        const component = root.addComponent('PageHome');
        if (component.resetInEditor) component.resetInEditor();
        await sprite('Background', root, base + 'page/home/resources/textures/background.png', 750, 1667);
        label('Title', root, '缤纷消水果', 60, 340);
        await sprite('Mango', root, base + 'page/home/resources/textures/mango.png', 220, 220, 0, 100);
        label('Subtitle', root, '轻点下落 · 同类成对消除', 28, -90);
        await button('StartButton', root, base + 'page/home/resources/textures/start-button.png', '开始游戏', -260, root, 'PageHome', 'startGame');
        const editorButton = label('EditorButton',root,'关卡编辑器',30,-400,400).node;
        const editorClick = editorButton.addComponent(cc.Button);
        const editorEvent = new cc.EventHandler();
        editorEvent.target=root; editorEvent.component='PageHome'; editorEvent.handler='openEditor';
        editorClick.clickEvents=[editorEvent];
        return save(root, base + 'page/home/native/PageHome.prefab');
    },

    /** 制作结算弹窗的标签和两枚独立按钮。 */
    async createResult() {
        const root = node('PopResult', null, 620, 740);
        const component = root.addComponent('PopResult');
        if (component.resetInEditor) component.resetInEditor();
        await sprite('Panel', root, base + 'pop/result/resources/textures/panel.png', 620, 740);
        component.titleLabel = label('Title', root, '全部消除！', 44, 310, 560);
        component.nextButton = await button('NextButton', root, base + 'pop/result/resources/textures/next-button.png', '下一关', 120, root, 'PopResult', 'next');
        component.reviveButton = await button('ReviveButton', root, base + 'pop/result/resources/textures/revive-button.png', '复活', 120, root, 'PopResult', 'revive');
        await button('RestartButton', root, base + 'pop/result/resources/textures/restart-button.png', '再玩一次', -20, root, 'PopResult', 'restart');
        await button('HomeButton', root, base + 'pop/result/resources/textures/home-button.png', '返回首页', -150, root, 'PopResult', 'home');
        return save(root, base + 'pop/result/native/PopResult.prefab');
    },

    /** 通知 XForge 按资产重新生成注册表。 */
    async refreshRegistry() {
        await Editor.Message.request('app', 'refresh-executor');
        return 'registered';
    },
};

/** 临时编辑器制作组件，用完删除，不挂载到任何交付资产。 */
@cc._decorator.ccclass('PrefabAuthoring')
export class PrefabAuthoring extends cc.Component {
    /** 从 MCP 执行限定的制作步骤；禁止在游戏运行时调用。 */
    async author(step) {
        if (!EDITOR) throw new Error('仅允许编辑器制作');
        if (!Object.prototype.hasOwnProperty.call(methods, step)) throw new Error('未知制作步骤');
        return methods[step]();
    }
}
