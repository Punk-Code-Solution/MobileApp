/**
 * Sistema de Telemedicina - Aplicativo Mobile
 * 
 * Copyright (c) 2025-2026 Punk Code Solution
 * CNPJ: 61.805.210/0001-41
 * Rua do Aconchego, Ilhéus - BA, CEP 45656-627
 * 
 * Este software é propriedade da Punk Code Solution e está protegido
 * pelas leis de direitos autorais brasileiras e internacionais.
 * Licenciado sob os termos da licença MIT.
 */

package com.mobiletelemedicina

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Frontend"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
