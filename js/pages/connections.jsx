var React = require('react')
var Nav = require('../views/nav.jsx')
var ConnectionList = require('../views/connectionlist.jsx')
var SwarmVis = require('../views/swarmvis.jsx')

function getLocation(multiaddr, cb) {
  var address = multiaddr.split('/')[2]

  // TODO: pick a random host from a list
  $.get('http://104.131.90.88:8080/json/' + address, function(res) {
    var location = res.country_name
    if(res.region_code) location = res.region_code + ', ' + location
    if(res.city) location = res.city + ', ' + location

    res.formatted = location
    cb(null, res)
  })
}

module.exports = React.createClass({
  getInitialState: function() {
    var t = this

    var getPeers = function() {
      t.props.ipfs.swarm.peers(function(err, res) {
        if(err) return console.error(err);

        var peers = res.Strings.sort(function(a, b) {
          return a.ID > b.ID ? 1 : -1
        })
        peers = peers.map(function(peer) {
          return {
            Address: peer.replace(/\/[^\/]+$/, ""),
            ID: peer.split('/')[5],
            ipfs: t.props.ipfs
          };
        });
        peers.forEach(function(peer){
          var location = t.state.locations[peer.ID]
          if(!location) {
            getLocation(peer.Address, function(err, res) {
              if(err) return console.error(err)

              peer.location = res
              t.state.locations[peer.ID] = res
              t.setState({
                peers: peers,
                locations: t.state.locations
              })
            })
          }
        })
      })
    }

    getPeers()
    t.props.pollInterval = setInterval(getPeers, 1000)

    return {
      peers: [],
      locations: {}
    }
  },

  componentWillUnmount: function() {
    clearInterval(this.props.pollInterval)
  },

  render: function() {
    return (
  <div className="row">
    <div className="col-sm-10 col-sm-offset-1">

      <h4>Connected to {this.state.peers.length} peer{this.state.peers.length !== 1 ? 's' : ''}</h4>
      <div className="panel panel-default">
        {ConnectionList({
          peers: this.state.peers
        })}
      </div>

      <Globe peers={this.state.peers} />

    </div>
  </div>
    )
  }
})

var Globe = React.createClass({
  getInitialState: function() {
    return { globe: null }
  },

  componentDidMount: function() {
    console.log('mount')
    var globe = new DAT.Globe(this.getDOMNode(), {
      imgDir: './static/img/'
    })
    globe.animate()
    this.setState({ globe: globe })
  },

  addPoints: function() {
    console.log(this.props.peers)
    var data = []
    this.props.peers.forEach(function(peer) {
      if(peer.location)
        data.push(peer.location.latitude, peer.location.longitude, 0.25)
    })

    if(!this.state.globe) return
    console.log('adding new data to globe:', data)
    this.state.globe.addData(data, { format: 'magnitude' })
    this.state.globe.createPoints()
  },

  render: function() {
    this.addPoints()
    return <div></div>
  }
})
