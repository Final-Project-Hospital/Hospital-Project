// imports
import React, { useEffect, useState, useRef } from 'react';
import { FaHome, FaBuilding, FaSearch, FaLayerGroup } from 'react-icons/fa';
import AddRoomModal from './data/room/create';
import EditRoomModal from './data/room/edit';
import Modal from '../harware/data/room/delete';
import { ListRoom, DeleteRoomById, ListBuilding } from '../../../services/hardware';
import { RoomInterface } from '../../../interface/IRoom';
import { BuildingInterface } from '../../../interface/IBuilding';
import { message } from 'antd';

import * as GiIcons from 'react-icons/gi';
import * as FaIcons from 'react-icons/fa';
import * as IoIcons from 'react-icons/io5';
import * as AiIcons from 'react-icons/ai';
import * as LuIcons from 'react-icons/lu';
import * as RiIcons from 'react-icons/ri';
import RoomCard from './data/room/index';

const Index: React.FC = () => {
  const [buildings, setBuildings] = useState<BuildingInterface[]>([]);
  const [rooms, setRooms] = useState<RoomInterface[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [queryBuilding, setQueryBuilding] = useState<number | "">("");
  const [queryFloor, setQueryFloor] = useState<string>("");
  const [queryName, setQueryName] = useState<string>("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const selectedRoomIdRef = useRef<number | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<RoomInterface | null>(null);

  const [pageSize, setPageSize] = useState(8);
  const [roomStartIndices, setRoomStartIndices] = useState<Record<number, number>>({});

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setPageSize(3);
      else if (width < 1200) setPageSize(4);
      else if (width < 1800) setPageSize(6);
      else setPageSize(8);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchBuildings = async () => {
    setLoadingBuildings(true);
    try {
      const data = await ListBuilding();
      if (data) setBuildings(data);
    } finally {
      setLoadingBuildings(false);
    }
  };

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const data = await ListRoom();
      if (data) setRooms(data);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchRooms();
  }, []);

  const handleCreateSuccess = () => {
    fetchRooms();
    setShowAddModal(false);
  };

  const handleUpdateSuccess = () => {
    fetchRooms();
    setShowEditModal(false);
    setSelectedRoom(null);
  };

  const handleDelete = (roomId: number, roomName: string) => {
    selectedRoomIdRef.current = roomId;
    setSelectedRoomName(roomName);
    setOpenConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (selectedRoomIdRef.current === null) return;
    setLoadingDelete(true);
    const success = await DeleteRoomById(selectedRoomIdRef.current);
    setLoadingDelete(false);
    if (success) {
      fetchRooms();
      message.success('ลบข้อมูลห้องสำเร็จ');
      setOpenConfirmModal(false);
      selectedRoomIdRef.current = null;
      setSelectedRoomName("");
    } else {
      alert("ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const cancelDelete = () => {
    selectedRoomIdRef.current = null;
    setSelectedRoomName("");
    setOpenConfirmModal(false);
  };

  const handleEditClick = (room: RoomInterface) => {
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  const allFloors = Array.from(new Set(rooms.map(r => r.Floor))).sort();
  const filterRooms = rooms.filter(room => {
    if (queryBuilding && room.Building?.ID !== queryBuilding) return false;
    if (queryFloor && String(room.Floor) !== queryFloor) return false;
    if (queryName && !room.RoomName?.toLowerCase().includes(queryName.toLowerCase())) return false;
    return true;
  });

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return FaIcons.FaQuestionCircle;
    const pools = { ...GiIcons, ...FaIcons, ...IoIcons, ...AiIcons, ...LuIcons, ...RiIcons };
    return (pools as any)[iconName] ?? FaIcons.FaQuestionCircle;
  };

  const handlePrevPage = (buildingID: number) => {
    setRoomStartIndices(prev => ({
      ...prev,
      [buildingID]: Math.max(0, (prev[buildingID] || 0) - pageSize)
    }));
  };

  const handleNextPage = (buildingID: number, totalRooms: number) => {
    setRoomStartIndices(prev => {
      const current = prev[buildingID] || 0;
      if (current + pageSize >= totalRooms) return prev;
      return { ...prev, [buildingID]: current + pageSize };
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 mt-16 md:mt-0 relative">
      {(loadingBuildings || loadingRooms) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white bg-opacity-70">
          <div className="flex flex-col items-center">
            <span className="animate-spin border-4 border-teal-400 rounded-full border-t-transparent w-12 h-12 mb-4" />
            <div className="text-lg font-semibold text-teal-700">กำลังโหลดข้อมูล...</div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-8 py-6 rounded-b-3xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold drop-shadow-md">ข้อมูลอาคาร</h1>
            <p className="text-sm drop-shadow-sm">โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-white text-teal-700 rounded-full shadow px-4 py-2 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-100">
              <FaHome size={14} />
            </span>
            <span className="font-medium">เพิ่มห้อง</span>
          </button>

        </div>
      </div>

      <div className="flex md:justify-end mb-6 mx-2 md:mx-8">
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center w-full md:w-fit">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <FaBuilding className="text-teal-700" />
            <select value={queryBuilding} onChange={e => setQueryBuilding(e.target.value === "" ? "" : Number(e.target.value))}
              className="rounded-lg border border-teal-200 px-3 py-2 bg-teal-50 focus:outline-none">
              <option value="">ทุกอาคาร</option>
              {buildings.map(b => <option key={b.ID} value={b.ID}>{b.BuildingName}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <FaLayerGroup className="text-teal-700" />
            <select value={queryFloor} onChange={e => setQueryFloor(e.target.value)}
              className="rounded-lg border border-teal-200 px-3 py-2 bg-teal-50 focus:outline-none">
              <option value="">ทุกชั้น</option>
              {allFloors.map(f => <option key={f} value={String(f)}>ชั้น {f}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <FaSearch className="text-teal-700" />
            <input type="text" value={queryName} onChange={e => setQueryName(e.target.value)}
              placeholder="ค้นหาชื่อห้อง..." className="rounded-lg border border-teal-200 px-3 py-2 w-full bg-teal-50 focus:outline-none" />
          </div>
          <button className="text-teal-600 underline text-xs" onClick={() => { setQueryBuilding(""); setQueryFloor(""); setQueryName(""); }}>
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      <div className="px-2 md:px-8 pb-12">
        {buildings.map(building => {
          const roomInBuilding = filterRooms.filter(r => r.Building?.ID === building.ID);
          if (roomInBuilding.length === 0) return null;
          const startIndex = roomStartIndices[building.ID!] || 0;
          const pagedRoom = roomInBuilding.slice(startIndex, startIndex + pageSize);
          return (
            <div key={building.ID} className="bg-white rounded-3xl shadow-md mb-10 p-5 flex flex-col transition hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-teal-400 via-white to-teal-100 shadow p-3 rounded-full flex items-center justify-center">
                  <FaBuilding className="text-teal-500 text-2xl drop-shadow-sm" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-teal-700">{building.BuildingName || '-'}</h2>
                  <div className="text-gray-400 text-xs font-medium">
                    ห้องทั้งหมดในอาคารนี้ : <span className="font-semibold text-teal-600">{roomInBuilding.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 justify-start p-1">
                {pagedRoom.map((room, idx) => {
                  const IconComp = getIconComponent(room.Icon);
                  return (
                    <RoomCard
                      key={room.ID ?? idx}
                      name={room.RoomName || 'ไม่มีข้อมูล'}
                      floor={`Floor ${room.Floor ?? '-'}`}
                      building={building.BuildingName || 'ไม่มีข้อมูล'}
                      IconComponent={IconComp}
                      onUpdate={() => handleEditClick(room)}
                      onDelete={() => handleDelete(room.ID!, room.RoomName || 'ไม่มีข้อมูล')}
                      hardwareID={room.Hardware?.ID!}
                    />
                  );
                })}
              </div>

              {roomInBuilding.length > pageSize && (
                <div className="flex justify-center gap-3 mt-4">
                  <button disabled={startIndex === 0} onClick={() => handlePrevPage(building.ID!)}
                    className="px-3 py-1 rounded bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400">ก่อนหน้า</button>
                  <button disabled={startIndex + pageSize >= roomInBuilding.length}
                    onClick={() => handleNextPage(building.ID!, roomInBuilding.length)}
                    className="px-3 py-1 rounded bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400">ถัดไป</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddRoomModal show={showAddModal} onClose={() => setShowAddModal(false)} onCreateSuccess={handleCreateSuccess} />
      {selectedRoom && (
        <EditRoomModal show={showEditModal} onClose={() => setShowEditModal(false)} onSaveSuccess={handleUpdateSuccess} initialData={selectedRoom} />
      )}
      <Modal open={openConfirmModal} onClose={cancelDelete}>
        <div className="bg-white">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-extrabold text-gray-900">ยืนยันการลบ</h3>
          </div>

          {/* Body */}
          <div className="">
            <p className="text-[15px] leading-6 text-gray-700">
              คุณต้องการลบอาคาร{" "}
              <span className="font-semibold text-red-500">
                {selectedRoomName}
              </span>{" "}
              ใช่หรือไม่?
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={cancelDelete}
              className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100"
            >
              ยกเลิก
            </button>

            <button
              onClick={confirmDelete}
              disabled={loadingDelete}
              className="inline-flex h-10 items-center rounded-lg bg-red-500 px-5 text-sm font-semibold text-white hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:opacity-70"
            >
              {loadingDelete ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  กำลังลบ...
                </>
              ) : (
                "ลบ"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Index;
