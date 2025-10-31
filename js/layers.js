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
    softcapStart(){
        return new Decimal(100).add(temp.fire.effect)
    },
    softcapPower(){return hasUpgrade('fire',12)?new Decimal(0.75):new Decimal(0.5)},
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
        let overAmount = base.sub(temp.f.softcapStart)
        let softcapped = overAmount.pow(temp.f.softcapPower).add(temp.f.softcapStart)
        return {amountAfterSoftcap:softcapped,reducedAmount:base.sub(softcapped)}
    },
    getResetGain(){
        return this.softcappedGain()["amountAfterSoftcap"].floor().minus(player[this.layer].points).max(0)
    },
    currencyAfterReset(){
        return player[this.layer].points.add(this.getResetGain())
    },
    getNextAt(canMax=true){
        let req = this.currencyAfterReset().add(1)
        if (req.gt(temp.f.softcapStart)) req = req.sub(temp.f.softcapStart).pow(1/temp.f.softcapPower).add(temp.f.softcapStart)
        return this.base.pow(req.pow(this.gainExp().pow(-1)).divide(this.gainMult())).add(6)
    },
    canReset(){
        return this.getResetGain().gte(1)
    },
    prestigeButtonText(){
        let str = `Reset tubes for +<b>${formatWhole(this.getResetGain())}</b> tube factories`
        if (this.currencyAfterReset().lt(200)) str += `<br/><br/>Req: ${format(player.points)} / ${format(this.getNextAt())} tubes.`
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
    doReset(){
        setClickableState('fire',11,false)
    },
    tabFormat: {
        "Main tab": {
            content:[
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
                    () => temp.f.currencyAfterReset.gte(100) ? `Due to <b>factory overflow</b> at ${format(temp.f.softcapStart)} tube factories, any factory gain over this amount is ^${format(temp.f.softcapPower)}!<br/>Your factory gain is reduced by ${formatWhole(temp.f.softcappedGain["reducedAmount"])}.` : ``,
                    {color: "red"}
                ],
                "blank",
                "buyables",
                "upgrades"
            ]
        },
        "Burning":{
            embedLayer: "fire",
            unlocked(){return hasUpgrade('f', 17)},
        }
    },
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
            description() {return `Tube factories are ${format(this.base())}x more effective per tube factory. (Softcaps at ${format(this.softcap)}x)`},
            cost: new Decimal(10),
            softcap: new Decimal('1e30'),
            base(){
                let base = new Decimal(1.1)
                base = base.add(buyableEffect('f', 11))
                return base
            },
            effect() {
                let effect_before_softcap = this.base().pow(player[this.layer].points)
                if (effect_before_softcap.lte(this.softcap)) return effect_before_softcap
                return this.softcap.times(effect_before_softcap.minus(this.softcap).add(1).log10().add(1).log10().pow(10)).min(effect_before_softcap)
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
        17: {
            title: "Stoke the fire",
            description: "Unlock the burning subtab.",
            cost: new Decimal(103),
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
    },
})
addLayer('fire', {
    name: "Fire",
    symbol: "F",
    position: 1,
    row: 1,
    startData(){return {points: new Decimal(0),burn_time: new Decimal(0),}},
    resource: "fire",
    color: "#f80",
    tabFormat:[
        "main-display",
        "clickables",
        "blank",
        "upgrades"
    ],
    unlocked(){return hasUpgrade('f', 17)},
    layerShown(){return false},
    update(diff) {
        if (getClickableState('fire',11)){
            if (player.points.gt(0)) player.fire.burn_time = player.fire.burn_time.plus(diff)
            else{
                setClickableState('fire',11,false)
                player.fire.points = player.fire.burn_time.mul(100).max(player.fire.points)
                player.fire.burn_time = new Decimal(0)
                if(player.points.lt(0)) player.points = new Decimal(0)
            }
        }
    },
    effect(){
        return player.fire.points.divide(100).pow(2)
    },
    effectDescription(){
        return `which delays the tube factory overflow by +${format(temp.fire.effect)} tube factories.`
    },
    clickables:{
        11:{
            title(){return !getClickableState('fire', 11) ? 'BURN YOUR TUBES' : 'STOP THE BURN'},
            display(){return !getClickableState('fire', 11) ? `Burning your tubes will stop all tube production, and will superexponentially decrease your tube amount, but you will gain fire base on the length of your burn.` : `Stop the burn. You have been burning for ${format(player.fire.burn_time)} seconds.<br/><br/>Note that doing a tube factory reset now will stop the burn without giving bonuses!`},
            canClick(){return hasUpgrade('f', 17)},
            onClick(){setClickableState('fire',11,!getClickableState('fire',11))}
        },
    },
    upgrades:{
        11: {
            title: "Steam boost",
            description: `Raise points production to ^${format(1.1)}`,
            cost: new Decimal(410),
        },
        12: {
            title: "INFLATION???",
            description: `Reduce the tube factory overflow penalty by +^0.25.`,
            cost: new Decimal(455),
        },
        13: {
            title: "Catalyst",
            description: `Multiply point gain by (log10(tubes+1)+1)^<br/>(fire/200)`,
            effect(){
                return player.points.add(1).log10().add(1).pow(player.fire.points.divide(200))
            },
            effectDisplay() {
                return format(upgradeEffect(this.layer, this.id))+"x" 
            },
            cost: new Decimal(490),
        }
    },
})
addLayer('a', {
    name: "Achievements",
    symbol: "A",
    position: 0,
    row: "side",
    resource: "achievements",
    tabFormat:[
        ["display-text", "Achievements are mostly for bragging but they can give you some cool effects.<br/><br/><br/>", ""],
        "achievements",
    ],
    achievements: {
        11: {
            name: "All my tubes are gone!!! D:",
            tooltip: "Do a tube factory reset. ",
            done(){return player.f.points.gt(0)}
        },
        12: {
            name: "Exponential production",
            tooltip: "Buy the fourth tube factory upgrade. Effect: 1.02x point production.",
            done(){return hasUpgrade('f', 14)}
        },
        13: {
            name: "Overflow",
            tooltip: "Have 100 tube factories",
            done(){return player.f.points.gte(100)}
        },
    }
})