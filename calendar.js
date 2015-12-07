var path_components = location.pathname.split('/').slice(2);
var year = path_components[0];
var month = path_components[1]

var data = [
[], // Day 1
[], // Day 2
[], // Day 3
[], // Day 4
[], // Day 5
[], // Day 6
[], // Day 7
[], // Day 8
[], // Day 9
[], // Day 10
[], // Day 11
[], // Day 12
[], // Day 13
[], // Day 14
[], // Day 15
[], // Day 16
[], // Day 17
[], // Day 18
[], // Day 19
[], // Day 20
[], // Day 21
[], // Day 22
[], // Day 23
[], // Day 24
[], // Day 25
[], // Day 26
[], // Day 27
[], // Day 28
[], // Day 29
[], // Day 30
[]  // Day 31
];

var months = {
1: 'January',
2: 'February',
3: 'March',
4: 'April',
5: 'May',
6: 'June',
7: 'July',
8: 'August',
9: 'September',
10: 'October',
11: 'November',
12: 'December'
};

var Appointment = React.createClass({
  render: function() {

      var style = {
        color: (this.props.data.status) ? 'blue' : 'red'
      }

      return (
        <p className="appointment" onClick={this.props.onClick} style={style}>
          #{this.props.data.coach}, {this.props.data.p_time} - {this.props.data.p_am_pm}, Status: {this.props.data.status}
        </p>
      );
  }
});

var Day = React.createClass({
  render: function() {
  
    function handleClick() {
      alert(JSON.stringify(this, null, 4));
    }

    // var apps = this.props.data.map(function(elem, i) {
    //   return <Appointment key={i} data={elem} onClick={handleClick.bind(elem)} ></Appointment>
    // });

    return ( 
      <div className="day">
        <p class="day_num">{this.props.index + 1}</p>
        // {apps}
      </div>
    );
  }
});

var Month = React.createClass({
  render: function() {
    
    var days = this.props.data.map(function(day, i) {

      return <Day data={day} key={i} index={i} ></Day>
    });

    return (
        <div className="month">
          <center><h1>{months[month]}</h1></center>
          {days}
        </div>
    );
  }
});

// Fetch data from web.mlcdates.com
$.ajax({
  url: 'http://web.mlcdates.com/calendar_query/' + year + '/' + month,
  dataType: 'json',
  success: function(response) {
    response.forEach(function(elem) {
      // console.log(elem);
      data[elem.p_day - 1].push(elem);
    });

    // console.log(data);

    ReactDOM.render(
      <Month data={data} />,
      document.getElementById('content')
    );
  },
  error: function(xhr, status, err) {
    console.log('Failed to get data.');
  }
});