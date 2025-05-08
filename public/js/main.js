(function($) {

	"use strict";

	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });

})(jQuery);



// start Dynamic chat app

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

var userData= JSON.parse(getCookie("user"))
var sender_id = userData._id;
var receiver_id;
var socket = io("/user-namespace", {
	auth: {
		token: userData._id
	}
});

$j(document).ready(function() {
	$j(".user-list").click(function() {
		var userId = $j(this).attr("data-id");
		receiver_id = userId;
		$j(".start-head").hide();
		$j(".chat-section").show();

		socket.emit("existsChat",{sender_id:sender_id, receiver_id:receiver_id})

	});

	$j('#chat-form').submit(function(event) {
		event.preventDefault();
		var message = $j('#message').val();

		$j.ajax({
			url: "/save-chat",
			type: "POST",
			data: {
				sender_id: sender_id,
				receiver_id: receiver_id,
				message: message
			},
			success: function(response) {
				if(response.success) {
					$j("#message").val('');
					let chat = response.data.message;
					let html = `
						<div class="current-user-chat" id="${response.data._id}">
							<h5> <span>${chat}</span>
								 <i class="fa fa-trash" aria-hidden="true" data-id="${response.data._id}" data-toggle="modal" data-target="#deleteChatModal"></i>
								 <i class="fa fa-edit" aria-hidden="true" data-id="${response.data._id}" data-msg="${chat}" data-toggle="modal" data-target="#editChatModal"></i>
								</h5>
						</div>
					`;
					$j('#chat-container').append(html);
					socket.emit("newChat",response.data)
					scrollChat()

				} else {
					alert(response.msg);
				}
			},
			error: function(xhr, status, error) {
				console.error("AJAX Error:", error);
			}

		});
	});
});

socket.on('getOnlineUser', function(data) {
	$j('#' + data.user_id + '-status').text('Online')
		.removeClass('offline-status')
		.addClass('online-status');
});

socket.on('getOfflineUser', function(data) {
	$j('#' + data.user_id + '-status').text('Offline')
		.addClass('offline-status')
		.removeClass('online-status');
});

socket.on("loadNewChat",function(data){
	if(sender_id==data.receiver_id && receiver_id==data.sender_id){
		let html = `
			 <div class="distance-user-chat" id="${data._id}">
			<h5>${data.message}</h5>
						</div>
					`;
		 $j('#chat-container').append(html);
	}
	scrollChat()

})

socket.on("loadChats", function(data) {
$("#chat-container").html("");
var chats = data.chats;
let html = "";

for (let x = 0; x < chats.length; x++) {
let addClass = "";

if (chats[x]["sender_id"] == sender_id) {
	addClass = "current-user-chat";
} else {
	addClass = "distance-user-chat";
}

			html += `
		<div class="${addClass}" id="${chats[x]["_id"]}">
			<h5>
			   <span> ${chats[x]["message"]}</span>`;

	if (chats[x]["sender_id"] == sender_id) {
		html += ` <i class="fa fa-trash" aria-hidden="true" data-id="${chats[x]["_id"]}" data-toggle="modal" data-target="#deleteChatModal"></i>
					<i class="fa fa-edit" aria-hidden="true" data-id="${chats[x]["_id"]}" data-msg="${chats[x]["message"]}" data-toggle="modal" data-target="#editChatModal"></i>`;
	}

	html += `
			</h5>
		</div>`;

		}

$("#chat-container").append(html);
scrollChat();
});


function scrollChat() {
const chatContainer = $j("#chat-container")[0];
chatContainer.scrollTop = chatContainer.scrollHeight;
}


$j(document).on("click",".fa-trash",function(){
let msg= $(this).parent().text()
$j("#delete-message").text(msg)
$j("#delete-message-id").val($(this).attr("data-id"))

})

$j("#delete-chat-form").submit(function (event) {
event.preventDefault();
var id = $j("#delete-message-id").val();

$j.ajax({
url: "/delete-chat",
type: "POST",
data: { id: id },
success: function (res) {
	if (res.success === true) {
		$("#" + CSS.escape(id)).remove(); 
		$("#deleteChatModal").modal("hide");
		socket.emit("chatDeleted", id);
	} else {
		alert(res.msg);
	}
},
error: function (xhr, status, error) {
	console.error("Delete AJAX Error:", error);
}
});
});

socket.on("chatMessageDeleted", function(id){
$("#"+id).remove()
})

$(document).on("click",".fa-edit",function(){
$("#edit-message-id").val($(this).attr("data-id"))
$("#update-message").val($(this).attr("data-msg"))
});



$("#update-chat-form").submit(function (event) {
event.preventDefault();
var id = $("#edit-message-id").val();
var msg = $("#update-message").val();

$j.ajax({
url: "/update-chat",
type: "POST",
data: { id: id, message:msg },
success: function (res) {
	if (res.success === true) {
		$("#"+id).find("span").text(msg)
		$("#"+id).find(".fa-edit").attr("data-msg",msg)
		$("#editChatModal").modal("hide");
		socket.emit("chatUpdated", {id:id,message:msg});
	} else {
		alert(res.msg);
	}
},
});
});

socket.on("chatMessageUpdated", function(data){
	$("#"+data.id).find("span").text(data.message)
})



$(".addMember").click(function(){
    var id= $j(this).attr("data-id");
    var limit= $j(this).attr("data-limit");

    $j("#group_id").val(id);
    $j("#limit").val(limit);

    $j.ajax({
        url:"/get-members",
        type:"POST",
        data:{group_id:id},
        success:function(res){  
            if(res.success==true){
                let users = res.data;
                let html = '';

                for(let i=0; i<users.length; i++){
                    html += `
                    <tr>
                        <td>
                            <input type="checkbox" name="members[]" value="${users[i]['_id']}"/>
                        </td>
                        <td>${users[i]['name']}</td>
                    </tr>
                    `;
                }
                $j(".addMembersInTable").html(html);  
            }else{
                alert(res.msg);
            }
        },
        error: function(xhr, status, error) {
            console.error("AJAX error:", error);
        }
    });
});