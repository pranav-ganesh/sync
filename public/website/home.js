(function ($) {
    "use strict";
  
    $(window).scroll(function() {
      if ($(this).scrollTop() > 100) {
        $('#header').addClass('header-scrolled');
      } else {
        $('#header').removeClass('header-scrolled');
      }
    });
  
    if ($(window).scrollTop() > 100) {
      $('#header').addClass('header-scrolled');
    }
  
  })(jQuery);

 const joinMeeting = () => {
  var value = $('#joinusername').val();
  let link = "https://salty-river-80456.herokuapp.com/" + value
  location.replace(link)
 }

 const createMeeting = () => {
  var link = "https://salty-river-80456.herokuapp.com/"
  location.replace(link)
 }