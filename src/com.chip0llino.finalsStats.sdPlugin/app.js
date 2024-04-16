/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />
/// <reference path="libs/js/utils.js" />


// Action Cache
const MACTIONS = {};

// Action Events
const playerRankAction = new Action('com.chip0llino.finalsStats.rank.action');

playerRankAction.onKeyUp(({ context, payload }) => {
    MACTIONS[context].openBoard(payload);
});

playerRankAction.onWillAppear(({ context,  payload }) => {
	MACTIONS[context] = new PlayerRankAction(context, payload)
});

playerRankAction.onWillDisappear(({context}) => {
    MACTIONS[context].interval && clearInterval(MACTIONS[context].interval);
    delete MACTIONS[context];
});

playerRankAction.onDidReceiveSettings(({context, payload}) => {
    MACTIONS[context].didReceiveSettings(payload?.settings);
});

$SD.onConnected(({ actionInfo, context }) => {
	console.log('Stream Deck connected! \n actionInfo: ' + actionInfo);
});

class PlayerRankAction {
    constructor (context, payload) {
        this.context = context;
        this.payload = payload;
        this.interval = null;
        this.settings = {
            ...{
                embarkId: "EmbarkID here",
                platform: "steam",
                leaderboardVersion: "live",
                upInterval: 5
            }, ...payload?.settings
        };
        this.saveSettings();
        this.init();
        this.update();
    }

    init() {
        console.log("Init call");
        this.interval = setInterval(() => {
            this.update();
        }, 30000);
    }

    didReceiveSettings(settings) {
        console.log("Recieved settings call");
        if(!settings) return;
        let dirty = false;
        if(settings.hasOwnProperty('embarkId')) {
            this.settings.embarkId = settings.embarkId;
            dirty = true;
        }
        if(settings.hasOwnProperty('platform')) {
            this.settings.platform = settings.platform;
            dirty = true;
        }
        if(settings.hasOwnProperty('leaderboardVersion')) {
            this.settings.leaderboardVersion = settings.leaderboardVersion;
            dirty = true;
        }
        if(settings.hasOwnProperty('upInterval')) {
            this.settings.upInterval = settings.upInterval;
            dirty = true;
        }
        if(dirty) this.update();
    }

    saveSettings(immediateUpdate = false) {
        console.log("Save settings call");
        $SD.setSettings(this.context, this.settings);
        if(immediateUpdate) this.update();
    };

    update() {
        console.log("Update call");
        /* Retrieve stats and set icon for current rank
        */
        const stats = this.retrieveStats;
        console.log("Stats retrieved: \n" + stats);

        $SD.setTitle(this.context, stats.data[0].league);
        /* const icon = `data:image/svg+xml;base64,${btoa(svg)}`;
        $SD.setImage(this.context, icon); */
        
    }

    retrieveStats() {
        console.log("Retrieve stats call");
        let season = this.settings.leaderboardVersion;
        let platform = this.settings.platform;
        let embarkId = this.settings.embarkId;

        let uri = `https://api.the-finals-leaderboard.com/v1/leaderboard/${season}/${platform}?name=${embarkId}`;

        fetch(uri)
            .then(response => { return response.json(); });
    }

    openBoard(payload) {
        console.log("open board action");
        let ctxSettings = payload.settings;
        let platform = ctxSettings.platform === 'crossplay' ? "" : ctxSettings.platform;
        let embarkId = ctxSettings.embarkId;

        let uri = `https://the-finals-leaderboard.com/?name=${embarkId}&platform=${platform}`;
        $SD.openUrl(uri);
    }
}