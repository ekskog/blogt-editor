Title:   random 

<script type="text/javascript">
window.onload = function(){

var year = Math.floor(Math.random()*(18-17+1)+17);
var month = Math.floor(Math.random()*(12-1+1)+1);
var day = Math.floor(Math.random()*(30-1+1)+1);
if (day < 10) 
day = '0' + day.toString()
if (month < 10) 
month = '0' + month.toString()
year = '20' +  year
url = year + month + day
window.open(url, '_self', false);
return false;

}
</script>
