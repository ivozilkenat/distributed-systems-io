const ping_obj = new Ping()
const PING_INTERVAL = 10000;

function ping_all() {
    document.getElementById("game-server-tbody")
        .querySelectorAll("tr")
        .forEach(tr => {
        const status_el = tr.querySelector(".status");
        const url_el = tr.querySelector(".url");
        const ping_el = tr.querySelector(".ping");
        if (status_el && url_el && ping_el && status_el.innerText === "HEALTHY") {
            ping_obj.ping(url_el.innerText, function (err, ping_time) {
                if (err) {
                    ping_el.innerText = err;
                } else {
                    ping_el.innerText = ping_time + "ms";
                }
            })
        }
    })
}

document.addEventListener("htmx:afterSwap", function(event) {
    if (event.detail.target.id === "game-server-tbody") {
        ping_all();
    }
})

setInterval(ping_all, 10000)