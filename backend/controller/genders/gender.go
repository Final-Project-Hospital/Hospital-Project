package genders


import (

   "net/http"


   "github.com/Tawunchai/hospital-project/config"

   "github.com/Tawunchai/hospital-project/entity"

   "github.com/gin-gonic/gin"

)


func GetAll(c *gin.Context) {


   db := config.DB()


   var genders []entity.Genders

   db.Find(&genders)


   c.JSON(http.StatusOK, &genders)


}