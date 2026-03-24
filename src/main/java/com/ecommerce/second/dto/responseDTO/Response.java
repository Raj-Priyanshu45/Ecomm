package com.ecommerce.second.dto.responseDTO;

public class Response {
    private String mess;
        public Response(String mess){
            this.mess = mess;
        }
        public void setMess(String mess){ this.mess = mess; }

        public String getMess(){ return mess;}
}