addLayer("f", {
    name: "factories", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "F", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
        best: new Decimal(0),
    }},
    color: "#dddd00",
    requires: new Decimal(8), // Can be a function that takes requirement increases into account
    resource: "tube factories", // Name of prestige currency
    baseResource: "tubes", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "custom", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    base: new Decimal(2),
    softcapStart: new Decimal(100),
    getBaseGain(){
        let base = player.points.minus(6).max(1).log(this.base).times(this.gainMult()).pow(this.gainExp())
        return base
    },
    softcappedGain(){
        let base = temp.f.getBaseGain
        if (base.lte(temp.f.softcapStart)){
            return {amountAfterSoftcap: base, reducedAmount: new Decimal(0)}
        }
        //softcap!!!
        let overAmount = base.sub(this.softcapStart)
        let softcapped = overAmount.pow(0.5).add(this.softcapStart)
        return {amountAfterSoftcap:softcapped,reducedAmount:base.sub(softcapped)}
    },
    getResetGain(){
        return this.softcappedGain()["amountAfterSoftcap"].floor().minus(player[this.layer].points).max(0)
    },
    currencyAfterReset(){
        return player[this.layer].points.add(this.getResetGain())
    },
    getNextAt(canMax=false){//only works when there is no softcap, but that's fine since it'd be hidden then
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
    tabFormat: [
        "main-display",
        "prestige-button",
        [
            "display-text",
            () => `You have ${formatWhole(player.points)} points`,
            ""
        ],
        [
            "display-text",
            () => `Your best tube factory is ${formatWhole(player[this.layer].best)}.`,
            ""
        ],
        [
            "display-text",
            () => temp.f.currencyAfterReset.gte(100) ? `Due to <b>factory overflow</b> at ${temp.f.softcapStart} tube factories, any factory gain over this amount is square rooted!<br/>Your factory gain is reduced by ${formatWhole(temp.f.softcappedGain["reducedAmount"])}.` : ``,
            {color: "red"}
        ],
        "blank",
        "buyables",
        "upgrades"
    ],
    upgrades: {
        11: {
            title: "Start",
            description: "Gain 1 tube per second.",
            cost: new Decimal(1),
        },
        12: {
            title: "Turn on the factory",
            description: "Each tube factory now produces 1 tube per second.",
            cost: new Decimal(1),
            unlocked(){return hasUpgrade(this.layer,this.id-1)},
        },
        13: {
            title: "The factory must grow",
            description: "Multiply tube factory gain based on your best tube factory.",
            cost: new Decimal(4),
            effect() {
                return player[this.layer].best.add(1).log(2).add(1).pow(0.5)
            },
            effectDisplay() {
                return format(upgradeEffect(this.layer, this.id))+"x" 
            },
            unlocked(){return hasUpgrade(this.layer,this.id-1)},
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
            unlocked(){return hasUpgrade(this.layer,this.id-1)},
        },
        15: {
            title: "Upgrade squared",
            description: "Unlock a buyable that boosts the previous upgrade.",
            cost: new Decimal(18),
            unlocked(){return hasUpgrade(this.layer,this.id-1)},
        },
        16: {
            title: "Upgrade cubed",
            description: "Unlock a buyable that boosts the previous buyable.",
            cost: new Decimal(36),
            unlocked(){return hasUpgrade(this.layer,this.id-1)},
        },
    },
    buyables: {
        11: {
            cost(x) { return new Decimal(16).times(new Decimal(2).pow(x)) },
            base(){
                let base = new Decimal(0.05)
                base = base.add(buyableEffect('f', 12))
                return base
            },
            display() { return `
                <b>Base Increase</b><br/>
                Increase the base of 'The factory must grow FASTER' by +${format(this.base())}.<br/>
                Cost: ${format(this.cost())} tube factories.
                Amount: ${getBuyableAmount(this.layer, this.id)}
                Effect: +${format(this.effect())} 
            ` },
            canAfford() { return player[this.layer].points.gte(this.cost()) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost())
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
            effect(){
                let ownedAmount = getBuyableAmount(this.layer, this.id)
                return ownedAmount.mul(this.base())
            },
            unlocked(){return hasUpgrade('f', 15)}
        },
        12: {
            cost(x) { return new Decimal(40).times(new Decimal(3).pow(x)) },
            base(){return new Decimal(0.02)},
            display() { return `
                <b>Base Increase Increaser</b><br/>
                Increase the base of 'Base Increase' by +${format(this.base())}.<br/>
                Cost: ${format(this.cost())} tube factories.
                Amount: ${getBuyableAmount(this.layer, this.id)}
                Effect: +${format(this.effect())} 
            ` },
            canAfford() { return player[this.layer].points.gte(this.cost()) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost())
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
            effect(){
                let ownedAmount = getBuyableAmount(this.layer, this.id)
                return ownedAmount.mul(this.base())
            },
            unlocked(){return hasUpgrade('f', 16)}
        },
    }  
})
