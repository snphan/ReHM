import React from "react";
import "./navbar.scss";

interface NavBarItem {
    title: string,
    imgSource: string,
    link: string
}

export function NavBar(props: any){
    return (
        <ul className="navbar">
        {props.items.map((item: NavBarItem, index: number) => {
            return (
                <li key={index} className="">
                    <a className="d-flex align-items-center" href={item.link}>
                        <img className="nav-pic" src={item.imgSource} alt="" />
                        <h6 className="mx-2 nav-item">{item.title.toUpperCase()}</h6>
                    </a>
                </li>
            )
        })}
        </ul>
    )
}