package entity

import (
	"gorm.io/gorm"
)

type HardwareParameter struct {
	gorm.Model
	Parameter string `valid:"required~Parameter is required"`
	Icon      string `gorm:"type:text" valid:"required~Icon is required"`
	Index     uint   `valid:"required~Index is required"`
	Right     bool
	GroupDisplay  bool
	LayoutDisplay bool
	Alert         bool

	StandardHardwareID uint              `valid:"required~StandardHardwareID is required"`
	StandardHardware   *StandardHardware `gorm:"foreignKey:StandardHardwareID" valid:"-"`

	UnitHardwareID uint        `valid:"required~UnitHardwareID is required"`
	UnitHardware   *UnitHardware `gorm:"foreignKey:UnitHardwareID" valid:"-"`

	HardwareGraphID uint          `valid:"required~HardwareGraphID is required"`
	HardwareGraph   *HardwareGraph `gorm:"foreignKey:HardwareGraphID" valid:"-"`

	HardwareParameterColorID uint                    `valid:"required~HardwareParameterColorID is required"`
	HardwareParameterColor   *HardwareParameterColor `gorm:"foreignKey:HardwareParameterColorID" valid:"-"`

	EmployeeID uint      `valid:"required~EmployeeID is required"`
	Employee   *Employee `gorm:"foreignKey:EmployeeID" valid:"-"`

	SensorDataParameter []SensorDataParameter `gorm:"foreignKey:HardwareParameterID" valid:"-"`
}
