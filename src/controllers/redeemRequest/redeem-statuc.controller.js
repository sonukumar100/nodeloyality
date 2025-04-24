// redeemStatus
function redeemStatus() {
    var redeemStatus = [];
    for (var i = 0; i < 10; i++) {
        redeemStatus.push({
            id: i,
            name: 'Redeem Status ' + i
        });
    }
    return redeemStatus;        
}