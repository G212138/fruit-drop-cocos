const assert = require('node:assert/strict');
const fs = require('node:fs');
const engine = 'C:/ProgramData/cocos/editors/Creator/3.8.8/resources/resources/3d/engine';
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/app.asar.unpacked/node_modules/typescript');
const b2 = require(engine + '/node_modules/@cocos/box2d/build/box2d/box2d.umd.js');

/** 使用引擎附带 Box2D 模拟两颗下落水果；半径为适配缩放后的约21像素，速度35米每秒覆盖长距离下落。 */
function penetration(bullet) {
    const world = new b2.b2World(new b2.b2Vec2(0, -50));
    /** 创建动态圆形测试刚体；y 为物理米，velocity 为米每秒。 */
    function create(y, velocity) {
        const definition = new b2.b2BodyDef();
        definition.type = b2.b2BodyType.b2_dynamicBody;
        definition.position.Set(0, y);
        definition.bullet = bullet;
        const body = world.CreateBody(definition);
        const shape = new b2.b2CircleShape();
        shape.m_radius = 0.65;
        body.CreateFixture(shape, 1);
        body.SetLinearVelocity(new b2.b2Vec2(0, velocity));
        return body;
    }
    const lower = create(0, 0);
    const upper = create(1.8, -35);
    let maximum = 0;
    for (let frame = 0; frame < 60; frame++) {
        world.Step(1 / 60, 10, 10);
        maximum = Math.max(maximum, (1.3 - (upper.GetPosition().y - lower.GetPosition().y)) * 32);
    }
    return maximum;
}
const before = penetration(false), after = penetration(true);
assert.ok(before > 2, '对照必须复现超过2像素的动态穿入');
assert.ok(after < 0.5 && after < before / 5, '连续检测应将最大穿入控制在半像素内');

// 测试真实工厂的初始化顺序：模拟挂入活动场景时立即创建物理刚体。
const activated = [];
class FruitItem {}
const cc = {
    Component: class {}, Node: class {}, Prefab: class {}, isValid: () => true,
    _decorator: { ccclass: () => value => value, property: () => () => {} },
    instantiate() {
        const fruit = { body: { bullet: false }, configure(kind) { this.kind = kind; } };
        return { getComponent: () => fruit, setPosition(x, y) { this.position = { x, y }; },
            set parent(value) { activated.push({ bullet: fruit.body.bullet, position: this.position }); } };
    },
};
const source = fs.readFileSync('assets/app-bundle/app-view/page/game/native/expansion/board/FruitSpawner.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true,
} }).outputText;
const loaded = { exports: {} };
new Function('require', 'module', 'exports', compiled)(name => {
    if (name === 'cc') return cc;
    if (name.endsWith('/GameTheme')) return { GameTheme: { active: 1 } };
    if (name.endsWith('/FruitItem')) return { FruitItem };
    if (name.endsWith('/BlackHoleFlow')) return { BlackHoleFlow: class {} };
    return {};
}, loaded, loaded.exports);
const spawner = new loaded.exports.FruitSpawner();
spawner.fruitRoot = {};
spawner.fruitPrefabs = [{ data: { getComponent: () => ({ kind: 21 }) } }];
spawner.spawn([{ kind: 21, x: 5, y: 200, iceLayers: 0 }], () => {});
// 黑洞补出成员同样使用 spawnOne，不能只在开局批量生成之后补设属性。
spawner.spawnOne({ kind: 21, x: 15, y: 300, iceLayers: 0 });
assert.deepEqual(activated, [
    { bullet: true, position: { x: 5, y: 200 } },
    { bullet: true, position: { x: 15, y: 300 } },
]);
console.log('连续碰撞验证通过：普通/黑洞生成在激活前设置，Box2D最大穿入', { before, after });
