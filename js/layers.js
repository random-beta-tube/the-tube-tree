addLayer("f", {
    name: "factories", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "F", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
    }},
    color: "#dddd00",
    requires: new Decimal(8), // Can be a function that takes requirement increases into account
    resource: "tube factories", // Name of prestige currency
    baseResource: "tubes", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "custom", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    base: new Decimal(2),
    getBaseGain(){
        return player.points.minus(6).max(1).log(this.base).times(this.gainMult()).pow(this.gainExp())
    },
    getResetGain(){
        return this.getBaseGain().floor().minus(player[this.layer].points).max(0)
    },
    currencyAfterReset(){
        return player[this.layer].points.add(this.getResetGain())
    },
    getNextAt(canMax=false){
        let req = this.currencyAfterReset().add(1)
        return this.base.pow(req.pow(this.gainExp().pow(-1)).divide(this.gainMult())).add(6)
    },
    canReset(){
        return this.getResetGain().gte(1)
    },
    prestigeButtonText(){
        console.log(String(this.getNextAt()))
        let str = `Reset tubes for +<b>${formatWhole(this.getResetGain())}</b> tube factories`
        if (this.currencyAfterReset().lt(100)) str += `<br/><br/>Req: ${format(player.points)} / ${format(this.getNextAt())} tubes.`
        return str
    },
    canBuyMax(){return true},
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        if (hasUpgrade('f', 13)) mult = mult.times(upgradeEffect('f', 13))
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "f", description: "F: Reset for tube factories", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true},
    upgrades: {
        11: {
            title: "Start",
            description: "Gain 1 tube per second.",
            cost: new Decimal(1),
        },
        12: {
            title: "Turn on the factory",
            description: "Each tube factory now produces 1 tube per second.",
            cost: new Decimal(2),
        },
        13: {
            title: "The factory must grow",
            description: "Multiply tube factory gain based on itself.",
            cost: new Decimal(4),
            effect() {
                return player[this.layer].points.add(1).log(2).add(1).pow(0.5)
            },
            effectDisplay() {
                return format(upgradeEffect(this.layer, this.id))+"x" 
            },
        },
        14: {
            title: "The factory must grow FASTER",
            description() {return `Tube factories are ${format(this.base())}x more effective per tube factory.`},
            cost: new Decimal(10),
            base(){
                let base = new Decimal(1.1)
                base = base.add(buyableEffect('f', 11))
                return base
            },
            effect() {
                //let softcap = new Decimal(100);
                let effect_before_softcap = this.base().pow(player[this.layer].points)
                return effect_before_softcap
                //if (effect_before_softcap.lte(softcap)){return effect_before_softcap}
                //return softcap.times(effect_before_softcap.minus(softcap).add(1).log10().add(1).log10())
            },
            effectDisplay() {
                return format(upgradeEffect(this.layer, this.id))+"x" 
            },
        },
        15: {
            title: "Upgrade squared",
            description: "Unlock a buyable.",
            cost: new Decimal(22),
        },
    },
    buyables: {
        11: {
            cost(x) { return new Decimal(16).times(new Decimal(2).pow(x)) },
            display() { return `
                <b>Base Increase</b><br/>
                Increase the base of 'The factory must grow FASTER' by +0.05.<br/>
                Cost: ${format(this.cost())} tube factories.
                Amount: ${getBuyableAmount(this.layer, this.id)}
                Effect: +${this.effect()} 
            ` },
            canAfford() { return player[this.layer].points.gte(this.cost()) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost())
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
            effect(){
                let ownedAmount = getBuyableAmount(this.layer, this.id)
                return ownedAmount.mul(0.05)
            },
            unlocked(){return hasUpgrade('f', 15)}
        },
    }  
})
